import { toast } from 'react-toastify';
import { getApperClient } from '@/services/apperClient';

// Simulate file upload with progress tracking and database storage
const simulateFileUpload = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        resolve(progress);
      } else {
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      }
    }, 200);

    // Simulate potential upload failures (5% chance)
    setTimeout(() => {
      if (Math.random() < 0.05 && progress < 100) {
        clearInterval(progressInterval);
        reject(new Error("Upload failed due to network error"));
      }
    }, Math.random() * 3000 + 1000);
  });
};

export const uploadFileService = {
  // Simulate file upload with progress tracking and database storage
  async uploadFile(file, onProgress) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      // Start progress simulation
      await simulateFileUpload(file, onProgress);

      // Create file record in database
      const fileRecord = {
        Name: file.name,
        name_c: file.name,
        size_c: file.size,
        type_c: file.type,
        status_c: "completed",
        progress_c: 100,
        uploadedAt_c: new Date().toISOString(),
        error_c: null
      };

      const response = await apperClient.createRecord('files_c', {
        records: [fileRecord]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      const createdFile = response.results?.[0]?.data;
      if (!createdFile) {
        throw new Error("Failed to create file record");
      }

      return {
        id: createdFile.Id,
        name: createdFile.name_c,
        size: createdFile.size_c,
        type: createdFile.type_c,
        status: createdFile.status_c,
        progress: createdFile.progress_c,
        uploadedAt: createdFile.uploadedAt_c,
        url: `https://example.com/files/${createdFile.name_c}`,
        error: createdFile.error_c
      };

    } catch (error) {
      console.error("Error uploading file:", error.message);
      throw error;
    }
  },

  // Get all upload sessions from database
  async getAllSessions() {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const response = await apperClient.fetchRecords('uploadSessions_c', {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "completedAt_c"}},
          {"field": {"Name": "completedCount_c"}},
          {"field": {"Name": "totalSize_c"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(session => ({
        Id: session.Id,
        name: session.Name,
        tags: session.Tags,
        totalSize: session.totalSize_c,
        completedCount: session.completedCount_c,
        startedAt: session.CreatedOn,
        completedAt: session.completedAt_c
      }));

    } catch (error) {
      console.error("Error fetching upload sessions:", error.message);
      return [];
    }
  },

  // Get session by ID from database
  async getSessionById(sessionId) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const response = await apperClient.getRecordById('uploadSessions_c', parseInt(sessionId), {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "completedAt_c"}},
          {"field": {"Name": "completedCount_c"}},
          {"field": {"Name": "totalSize_c"}}
        ]
      });

      if (!response.success || !response.data) {
        throw new Error(`Upload session with ID ${sessionId} not found`);
      }

      const session = response.data;
      return {
        Id: session.Id,
        name: session.Name,
        tags: session.Tags,
        totalSize: session.totalSize_c,
        completedCount: session.completedCount_c,
        startedAt: session.CreatedOn,
        completedAt: session.completedAt_c
      };

    } catch (error) {
      console.error(`Error fetching session ${sessionId}:`, error.message);
      throw error;
    }
  },

  // Create new upload session in database
  async createSession(sessionData) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const sessionRecord = {
        Name: sessionData.name || `Session ${Date.now()}`,
        Tags: sessionData.tags || '',
        totalSize_c: sessionData.totalSize || 0,
        completedCount_c: 0,
        completedAt_c: null
      };

      const response = await apperClient.createRecord('uploadSessions_c', {
        records: [sessionRecord]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      const createdSession = response.results?.[0]?.data;
      if (!createdSession) {
        throw new Error("Failed to create session record");
      }

      return {
        Id: createdSession.Id,
        name: createdSession.Name,
        tags: createdSession.Tags,
        totalSize: createdSession.totalSize_c,
        completedCount: createdSession.completedCount_c,
        startedAt: createdSession.CreatedOn,
        completedAt: createdSession.completedAt_c
      };

    } catch (error) {
      console.error("Error creating session:", error.message);
      throw error;
    }
  },

  // Update upload session in database
  async updateSession(sessionId, updateData) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const updateRecord = {
        Id: parseInt(sessionId)
      };

      if (updateData.completedCount !== undefined) {
        updateRecord.completedCount_c = updateData.completedCount;
      }
      if (updateData.completedAt !== undefined) {
        updateRecord.completedAt_c = updateData.completedAt;
      }

      const response = await apperClient.updateRecord('uploadSessions_c', {
        records: [updateRecord]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      const updatedSession = response.results?.[0]?.data;
      if (!updatedSession) {
        throw new Error("Failed to update session record");
      }

      return {
        Id: updatedSession.Id,
        name: updatedSession.Name,
        tags: updatedSession.Tags,
        totalSize: updatedSession.totalSize_c,
        completedCount: updatedSession.completedCount_c,
        startedAt: updatedSession.CreatedOn,
        completedAt: updatedSession.completedAt_c
      };

    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error.message);
      throw error;
    }
  },

  // Delete upload session from database
  async deleteSession(sessionId) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const response = await apperClient.deleteRecord('uploadSessions_c', {
        RecordIds: [parseInt(sessionId)]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return { success: true, deletedId: sessionId };

    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error.message);
      throw error;
    }
  },

  // Validate file before upload
  async validateFile(file, maxSize = 100 * 1024 * 1024) {
    const errors = [];
    
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }
    
    if (file.name.length > 255) {
      errors.push("File name is too long (max 255 characters)");
    }
    
    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push("File type not allowed for security reasons");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get all files from database
  async getAllFiles() {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const response = await apperClient.fetchRecords('files_c', {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "size_c"}},
          {"field": {"Name": "type_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "progress_c"}},
          {"field": {"Name": "uploadedAt_c"}},
          {"field": {"Name": "error_c"}},
          {"field": {"Name": "uploadSessionId_c"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(file => ({
        id: file.Id,
        name: file.name_c,
        size: file.size_c,
        type: file.type_c,
        status: file.status_c,
        progress: file.progress_c,
        uploadedAt: file.uploadedAt_c,
        error: file.error_c,
        uploadSessionId: file.uploadSessionId_c?.Id || file.uploadSessionId_c
      }));

    } catch (error) {
      console.error("Error fetching files:", error.message);
      return [];
    }
  }
};