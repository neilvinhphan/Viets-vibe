import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoricalScene } from '../data/historicalScenes';

interface SceneBackgroundProps {
  scene: HistoricalScene;
  opacityLevel?: 'ultra_faint' | 'subtle'; // 5% vs 10%
}

export const SceneBackground: React.FC<SceneBackgroundProps> = ({
  scene,
  opacityLevel = 'subtle',
}) => {
  const opacityClass = opacityLevel === 'ultra_faint' ? 'opacity-5' : 'opacity-10';

  return (
    <div
      id="historical-scene-container"
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
        >
          {/*
            The Watermark Effect:
            - grayscale: strips color to behave like an antique sketch/woodblock etching
            - opacity-10 (or opacity-5): keeps it faint and non-intrusive
            - mix-blend-multiply: blends ink directly into the soft parchment paper canvas
            - pointer-events-none: never obstructs user interaction with avatar or hotspots
          */}
          <div
            id={`scene-watermark-${scene.id}`}
            className={`w-full h-full grayscale ${opacityClass} mix-blend-multiply contrast-125 transition-opacity duration-1000 flex items-center justify-center pointer-events-none`}
          >
            {scene.renderArtwork()}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
