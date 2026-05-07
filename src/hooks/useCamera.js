import { useState, useCallback } from 'react';

/**
 * Custom hook for managing camera operations
 * Handles camera stream, photo capture, and cleanup
 */
export const useCamera = () => {
  const [cameraConfig, setCameraConfig] = useState({
    isOpen: false,
    field: null,
    index: null,
    stream: null,
  });

  const startCamera = useCallback(async (field, index = null, facingMode = 'environment') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      setCameraConfig({ isOpen: true, field, index, stream });
      return stream;
    } catch (err) {
      console.error('Camera Error:', err);
      throw new Error('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraConfig.stream) {
      cameraConfig.stream.getTracks().forEach((track) => track.stop());
    }
    setCameraConfig({ isOpen: false, field: null, index: null, stream: null });
  }, [cameraConfig.stream]);

  const capturePhoto = useCallback(async (videoRef, canvasRef) => {
    if (!videoRef?.current || !canvasRef?.current) {
      throw new Error('Video or Canvas ref not available');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    return new Promise((resolve, reject) => {
      try {
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error('Failed to capture photo'));
          else resolve(blob);
        }, 'image/jpeg', 0.8);
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  return {
    cameraConfig,
    setCameraConfig,
    startCamera,
    stopCamera,
    capturePhoto,
  };
};
