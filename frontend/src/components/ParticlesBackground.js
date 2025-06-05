import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadLinksPreset } from 'tsparticles-preset-links';

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    // load preset instead of loadFull
    await loadLinksPreset(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        preset: 'links', // <-- 링크 효과 미리셋
        background: { color: 'transparent' },
        particles: {
          color: { value: ['#ffffff', '#a777e3', '#42e695'] },
          links: {
            enable: true,
            distance: 100,
            color: '#ffffff',
            opacity: 0.3,
            width: 1,
          },
        },
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
};

export default ParticlesBackground;
