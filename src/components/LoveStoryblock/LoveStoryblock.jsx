import { useEffect, useRef } from "react";
import "../../App.css";
import "./LoveStoryblock.scss";

const VIDEOS = ["/vi1.mp4", "/vi2.mp4", "/vi3.mp4"];

const LoveStoryblock = () => {
  const sectionRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        videoRefs.current.forEach((video) => {
          if (!video) return;

          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="LoveStoryblock" ref={sectionRef} aria-label="Love story">
      <div className="LoveStoryblock_sequence container">
        {VIDEOS.map((src, index) => {
          const segmentClass =
            index === 0
              ? "LoveStoryblock_segment--top"
              : index === 1
                ? "LoveStoryblock_segment--focus"
                : "LoveStoryblock_segment--bottom";

          return (
            <div key={src} className={`LoveStoryblock_segment ${segmentClass}`}>
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                className="LoveStoryblock_video"
                src={src}
                muted
                playsInline
                loop
                preload="auto"
                disablePictureInPicture
                controls={false}
                controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
              />
              {/* {index === 0 && (
                <h2 className="LoveStoryblock_title">Narek Elen</h2>
              )} */}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LoveStoryblock;
