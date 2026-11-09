import React, { useEffect, useRef } from 'react';

export const FaceLandmarkOverlay = ({
  landmarks = [],
  bbox = null,
  gaze = null,
  head = null,
  dwell = null,
  showWireframe = true,
  showIris = true,
  showHeadPose = true,
  showDwell = true,
  width = 640,
  height = 480
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Bounding Box
    if (bbox && bbox.width > 0 && bbox.height > 0) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      
      // Corner accents
      const cornerLen = 14;
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2.5;
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(bbox.x, bbox.y + cornerLen);
      ctx.lineTo(bbox.x, bbox.y);
      ctx.lineTo(bbox.x + cornerLen, bbox.y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(bbox.x + bbox.width - cornerLen, bbox.y);
      ctx.lineTo(bbox.x + bbox.width, bbox.y);
      ctx.lineTo(bbox.x + bbox.width, bbox.y + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(bbox.x, bbox.y + bbox.height - cornerLen);
      ctx.lineTo(bbox.x, bbox.y + bbox.height);
      ctx.lineTo(bbox.x + cornerLen, bbox.y + bbox.height);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(bbox.x + bbox.width - cornerLen, bbox.y + bbox.height);
      ctx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height);
      ctx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height - cornerLen);
      ctx.stroke();
    }

    // 2. Draw Facial Mesh Landmarks
    if (showWireframe && landmarks && landmarks.length > 0) {
      ctx.fillStyle = '#38BDF8';
      for (let i = 0; i < landmarks.length; i++) {
        const pt = landmarks[i];
        const x = pt.x * width;
        const y = pt.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 3. Draw Gaze Point & Dwell Circle
    if (gaze && gaze.x !== undefined && gaze.y !== undefined) {
      const gx = gaze.x * width;
      const gy = gaze.y * height;

      // Draw Crosshair
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, 8, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(gx - 12, gy);
      ctx.lineTo(gx + 12, gy);
      ctx.moveTo(gx, gy - 12);
      ctx.lineTo(gx, gy + 12);
      ctx.stroke();

      // Draw Dwell Progress Ring
      if (showDwell && dwell && dwell.progress > 0) {
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(gx, gy, 18, -Math.PI / 2, -Math.PI / 2 + dwell.progress * 2 * Math.PI);
        ctx.stroke();
      }
    }

    // 4. Draw Head Pose Vector
    if (showHeadPose && head && head.yaw !== undefined && bbox) {
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      const length = 40;

      // Pitch (vertical tilt) and Yaw (horizontal rotation)
      const targetX = centerX + Math.sin((head.yaw * Math.PI) / 180) * length * 1.5;
      const targetY = centerY + Math.sin((head.pitch * Math.PI) / 180) * length * 1.5;

      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Vector head circle
      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [landmarks, bbox, gaze, head, dwell, showWireframe, showIris, showHeadPose, showDwell, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export default FaceLandmarkOverlay;
