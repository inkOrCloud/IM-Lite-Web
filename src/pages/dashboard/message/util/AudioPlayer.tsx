import React, { useEffect, useRef } from "react";
import { create } from "zustand";
import { produce } from "immer";
import { Button, Progress } from "antd";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src?: string;
  filename?: string;
}

// Zustand store
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setPlaying: (playing: boolean) => void;
  setTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  setPlaying: (playing) =>
    set(
      produce((state: PlayerState) => {
        state.isPlaying = playing;
      })
    ),
  setTime: (time) =>
    set(
      produce((state: PlayerState) => {
        state.currentTime = time;
      })
    ),
  setDuration: (duration) =>
    set(
      produce((state: PlayerState) => {
        state.duration = duration;
      })
    ),
}));

// 格式化秒数 -> mm:ss
const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({src, filename}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, currentTime, duration, setPlaying, setTime, setDuration } =
    usePlayerStore();

  // 初始化事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setTime, setDuration, setPlaying]);

  // 播放/暂停切换
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  // 拖动进度条
  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setTime(value);
  };

  return (
    <div className="w-full max-w-md p-4 rounded-2xl bg-white border-1 border-gray-200 dark:bg-gray-800 transition-colors">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* 文件名 */}
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
        {filename}
      </div>

      {/* 控件区域 */}
      <div className="flex items-center gap-4">
        <Button
          type="primary"
          shape="circle"
          size="large"
          onClick={togglePlay}
          icon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
        />

        <div className="flex-1">
          {/* 时间 + 进度条 */}
          <div
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newTime = (clickX / rect.width) * duration;
              handleSeek(newTime);
            }}
          >
          <Progress
            percent={duration ? (currentTime / duration) * 100 : 0}
            showInfo={false}
            strokeColor="#1677ff"
            className="cursor-pointer"
          />
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;