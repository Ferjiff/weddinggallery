import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import { insertMediaSchema } from "@shared/schema";
import path from "path";
import crypto from "crypto";
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para subir un archivo
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No se envió ningún archivo' });
    }

    // Subida del archivo a Cloudinary
    const stream = cloudinary.uploader.upload_stream({}, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error subiendo el archivo' });
      }
      res.json({ url: result?.secure_url });
    });

    stream.end(file.buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;


// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images and videos
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all media files
  app.get("/api/media", async (_req: Request, res: Response) => {
    try {
      const media = await storage.getAllMedia();
      return res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      return res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Get a specific media file
  app.get("/api/media/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const mediaData = await storage.getMediaFile(id);
      if (!mediaData) {
        return res.status(404).json({ message: "Media not found" });
      }

      // Set appropriate content type
      res.setHeader("Content-Type", mediaData.mediaInfo.fileType);
      // Send the file data
      return res.send(mediaData.data);
    } catch (error) {
      console.error("Error serving media:", error);
      return res.status(500).json({ message: "Failed to serve media file" });
    }
  });

  // Download a media file with attachment disposition
  app.get("/api/media/:id/download", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const mediaData = await storage.getMediaFile(id);
      if (!mediaData) {
        return res.status(404).json({ message: "Media not found" });
      }

      // Set headers for download
      res.setHeader("Content-Type", mediaData.mediaInfo.fileType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${mediaData.mediaInfo.fileName}"`
      );
      // Send the file
      return res.send(mediaData.data);
    } catch (error) {
      console.error("Error downloading media:", error);
      return res.status(500).json({ message: "Failed to download media file" });
    }
  });

  // Get a thumbnail for video files
  app.get("/api/media/:id/thumbnail", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const mediaInfo = await storage.getMediaById(id);
      if (!mediaInfo) {
        return res.status(404).json({ message: "Media not found" });
      }

      // For videos, we'll use a placeholder thumbnail
      // In a production app, you would generate actual thumbnails from videos
      if (mediaInfo.fileType.startsWith("video/")) {
        // Respond with a placeholder image
        res.setHeader("Content-Type", "image/svg+xml");
        const placeholderSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="#333333" />
            <text x="50%" y="50%" fill="#ffffff" font-family="Arial" font-size="24" text-anchor="middle">
              Video: ${mediaInfo.fileName}
            </text>
          </svg>
        `;
        return res.send(placeholderSvg);
      } else {
        // If it's not a video, just serve the image directly
        const mediaData = await storage.getMediaFile(id);
        if (!mediaData) {
          return res.status(404).json({ message: "Media file not found" });
        }
        res.setHeader("Content-Type", mediaInfo.fileType);
        return res.send(mediaData.data);
      }
    } catch (error) {
      console.error("Error serving thumbnail:", error);
      return res.status(500).json({ message: "Failed to serve thumbnail" });
    }
  });

  // Upload media files
  app.post(
    "/api/media/upload",
    upload.array("media"),
    async (req: Request, res: Response) => {
      try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadedFiles = req.files as Express.Multer.File[];
        const uploadResults = [];

        for (const file of uploadedFiles) {
          // Create a media record
          const mediaData = {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            metadata: {
              originalName: file.originalname,
            },
          };

          try {
            // Validate the media data
            insertMediaSchema.parse(mediaData);

            // Store the media file
            const mediaRecord = await storage.createMedia(
              mediaData,
              file.buffer
            );
            uploadResults.push({
              id: mediaRecord.id,
              fileName: mediaRecord.fileName,
              status: "success",
            });
          } catch (error) {
            console.error("Error processing file:", file.originalname, error);
            uploadResults.push({
              fileName: file.originalname,
              status: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        return res.status(201).json({
          message: "Files processed",
          results: uploadResults,
        });
      } catch (error) {
        console.error("Error uploading files:", error);
        return res.status(500).json({
          message: "Failed to process uploaded files",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Delete a media file
  app.delete("/api/media/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const deleted = await storage.deleteMedia(id);
      if (!deleted) {
        return res.status(404).json({ message: "Media not found or already deleted" });
      }

      return res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      return res.status(500).json({ message: "Failed to delete media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
