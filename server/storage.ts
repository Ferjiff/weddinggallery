import { users, type User, type InsertUser, mediaFiles, type MediaFile, type InsertMedia } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a directory for storing the media files
const mediaDir = path.join(__dirname, '..', 'media_storage');

// Ensure the media directory exists
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Media operations
  getAllMedia(): Promise<MediaFile[]>;
  getMediaById(id: number): Promise<MediaFile | undefined>;
  createMedia(media: InsertMedia, fileData: Buffer): Promise<MediaFile>;
  deleteMedia(id: number): Promise<boolean>;
  getMediaFile(id: number): Promise<{ data: Buffer; mediaInfo: MediaFile } | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private media: Map<number, MediaFile>;
  userCurrentId: number;
  mediaCurrentId: number;

  constructor() {
    this.users = new Map();
    this.media = new Map();
    this.userCurrentId = 1;
    this.mediaCurrentId = 1;
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Media Operations
  async getAllMedia(): Promise<MediaFile[]> {
    return Array.from(this.media.values());
  }

  async getMediaById(id: number): Promise<MediaFile | undefined> {
    return this.media.get(id);
  }

  async createMedia(insertMedia: InsertMedia, fileData: Buffer): Promise<MediaFile> {
    const id = this.mediaCurrentId++;
    const media: MediaFile = { ...insertMedia, id };
    
    // Save the media file to disk
    const filePath = path.join(mediaDir, `${id}_${media.fileName}`);
    fs.writeFileSync(filePath, fileData);
    
    // Store the media metadata in memory
    this.media.set(id, media);
    
    return media;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const media = this.media.get(id);
    if (!media) return false;
    
    // Delete the file from disk
    try {
      const filePath = path.join(mediaDir, `${id}_${media.fileName}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove from memory
      this.media.delete(id);
      return true;
    } catch (error) {
      console.error("Error deleting media:", error);
      return false;
    }
  }

  async getMediaFile(id: number): Promise<{ data: Buffer; mediaInfo: MediaFile } | undefined> {
    const media = this.media.get(id);
    if (!media) return undefined;
    
    try {
      const filePath = path.join(mediaDir, `${id}_${media.fileName}`);
      if (!fs.existsSync(filePath)) return undefined;
      
      const data = fs.readFileSync(filePath);
      return { data, mediaInfo: media };
    } catch (error) {
      console.error("Error reading media file:", error);
      return undefined;
    }
  }
}

export const storage = new MemStorage();
