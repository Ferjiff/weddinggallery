import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';


cloudinary.config({
  cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME',
  api_key: 'process.env.CLOUDINARY_API_KEY',
  api_secret: 'process.env.CLOUDINARY_API_SECRET'
});


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});
// Configurar multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para subir imágenes
const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se encontró el archivo' });
    }

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Error al subir a Cloudinary:', error);
          return res.status(500).json({ error: 'Error al subir archivo' });
        }

        if (result) {
          return res.status(200).json({ url: result.secure_url });
        }
      }
    );

    if (result && req.file) {
      // Aquí conectamos el stream
      const stream = result;
      stream.end(req.file.buffer);
    }
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Asegúrate de agregar este router al app principal
app.use('/api', router);


(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
