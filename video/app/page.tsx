'use client'; 

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Play, Pause, Volume2, VolumeX, 
    SkipBack, SkipForward, RefreshCcw, Maximize 
} from 'lucide-react'; 
import './globals.css';

interface Video {
    name: string;
    url: string;
    poster: string;
    autor: string;
}

const videos: Video[] = [
    {
      name: "Max Verstappen",
      url: "/max.mp4",
      poster: "/vespa.jpeg", 
      autor: "formulafolds"  
    },
    {
      name: "Interlagos",
      url: "/corrida.mp4",
      poster: "/interlagos.jpeg",
      autor: "Davi Maia"  
    },
    {
      name: "christmas at Hogwarts",
      url: "/christmasAtHogwarts.mp4",
      poster: "/christmas.jpg",
      autor: "MikeJigsaw"  
    }
];

const formatTime = (timeInSeconds: number) => {
    if (Number.isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function VideoPlayerSimulator() {
    const [isPlaying, setIsPlaying] = useState<boolean>(false); 
    const [volume, setVolume] = useState<number>(0.5); 
    const [isVolumeControlVisible, setIsVolumeControlVisible] = useState<boolean>(false);
    const [lastVolume, setLastVolume] = useState<number>(0.5); 
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0); 
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const videoRef = useRef<HTMLVideoElement>(null); 
    const currentVideo = videos[currentTrackIndex];

    const playVideo = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;
        
        try {
            await video.play();
        } catch (error) {
            console.error("Falha ao reproduzir o vídeo:", error);
        }
    }, []);
    
    const pauseVideo = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            video.pause();
        }
    }, []);

    const handlePlayPause = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;
        
        if (video.paused) {
            await playVideo();
        } else {
            pauseVideo();
        }
    }, [playVideo, pauseVideo]);

    const selectTrack = useCallback(async (index: number) => {
        if (index === currentTrackIndex) {
            await handlePlayPause();
            return;
        }
        
        const video = videoRef.current;
        const wasPlaying = video && !video.paused;
        
        setIsLoading(true);
        setCurrentTrackIndex(index);
        setIsPlaying(false);
        
        if (wasPlaying) {
            setTimeout(() => {
                const newVideo = videoRef.current;
                if (newVideo) {
                    playVideo().finally(() => setIsLoading(false));
                }
            }, 300);
        } else {
            setIsLoading(false);
        }
    }, [currentTrackIndex, handlePlayPause, playVideo]);

    const skipTrack = useCallback((direction: 1 | -1) => {
        const newIndex = (currentTrackIndex + direction + videos.length) % videos.length;
        selectTrack(newIndex);
    }, [currentTrackIndex, selectTrack]);

    const handleTrackEnded = useCallback(() => {
        skipTrack(1);
    }, [skipTrack]);

    const handleSkip10Seconds = useCallback((seconds: 10 | -10) => {
        const video = videoRef.current;
        if (video) {
            video.currentTime += seconds;
        }
    }, []);

    const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        
        const video = videoRef.current;
        if (video) {
            video.volume = newVolume;
            
            if (newVolume > 0) {
                setLastVolume(newVolume);
            }
        }
    }, []);

    const handleMuteToggle = useCallback(() => {
        if (volume > 0) {
            setLastVolume(volume);
            setVolume(0);
        } else {
            const restoredVolume = lastVolume > 0 ? lastVolume : 0.5;
            setVolume(restoredVolume);
        }
        
        const video = videoRef.current;
        if (video) {
            video.volume = volume > 0 ? 0 : (lastVolume > 0 ? lastVolume : 0.5);
        }
    }, [volume, lastVolume]);

    const handleSeekChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = parseFloat(event.target.value);
        setCurrentTime(seekTime);
        const video = videoRef.current;
        if (video) {
            video.currentTime = seekTime;
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                video.requestFullscreen();
            }
        }
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            if (!isNaN(video.currentTime)) {
                setCurrentTime(video.currentTime);
            }
        };
        
        const updateDuration = () => {
            if (!isNaN(video.duration)) {
                setDuration(video.duration);
            }
        };
        
        const handlePlay = () => {
            setIsPlaying(true);
            setIsLoading(false);
        };
        
        const handlePause = () => setIsPlaying(false);
        
        const handleEnded = () => {
            setIsPlaying(false);
            handleTrackEnded();
        };
        
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);
        video.volume = volume;

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [handleTrackEnded, volume]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        setIsPlaying(false);
        
        if (video.src !== currentVideo.url) {
            video.src = currentVideo.url;
            video.load();
            setCurrentTime(0);
        }
        
        video.poster = currentVideo.poster;
        
    }, [currentTrackIndex, currentVideo.url, currentVideo.poster]);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.volume = volume;
        }
    }, [volume]);

    const VolumeIcon = volume === 0 ? VolumeX : Volume2;
    const progressWidth = duration > 0 ? (currentTime / duration) * 100 : 0;
    const displayVolumePercent = Math.round(volume * 100);
    const progressBarStyle = {
        '--progress-percent': `${progressWidth}%`,
    } as React.CSSProperties;

    const volumeBarStyle = {
        '--volume-percent': `${displayVolumePercent}%`,
    } as React.CSSProperties;

    return (
        <div className="main-container split-layout"> 
            <div className="player-container video-player-box">
                <div className="video-wrapper" onClick={handlePlayPause}>
                    <video 
                        ref={videoRef} 
                        src={currentVideo.url}
                        poster={currentVideo.poster}
                        className="main-video-element"
                        preload="metadata"
                    >
                        <source src={currentVideo.url} type="video/mp4" /> 
                        <track kind="captions" src="/captions/empty.vtt" label="Empty" default />
                    </video>
                    
                    {!isPlaying && !isLoading && (
                        <div className="center-play-button">
                            <Play size={60} color="#fff" fill="#fff" />
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="center-play-button">
                            <div className="loading-spinner"></div>
                        </div>
                    )}
                </div>

                <div className="progress-bar-container">
                    <div className="progress-time">{formatTime(currentTime)}</div> 
                    <div className="progress-bar">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0.01}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeekChange}
                            className="seek-slider"
                            style={progressBarStyle}
                        />
                    </div>
                    <div className="progress-time">{formatTime(duration)}</div> 
                </div>

                <div className="controls video-controls-bar">
                    <button 
                        onClick={() => skipTrack(-1)}
                        className="control-button"
                        aria-label="Vídeo anterior"
                    >
                        <SkipBack size={24} /> 
                    </button>

                    <div className="playback-controls">
                        <button 
                            onClick={() => handleSkip10Seconds(-10)}
                            className="control-button skip-button"
                            aria-label="Retroceder 10 segundos"
                        >
                            <RefreshCcw size={18} />
                            <span style={{fontSize: '10px'}}>-10</span>
                        </button>

                        <button 
                            onClick={handlePlayPause}
                            className="control-button play-button"
                            aria-label={isPlaying ? "Pausar" : "Tocar"}
                            disabled={isLoading}
                        >
                            {isPlaying ? (
                                <Pause size={30} color="#fff" />
                            ) : (
                                <Play size={30} color="#fff" fill="#fff" />
                            )}
                        </button>

                        <button 
                            onClick={() => handleSkip10Seconds(10)}
                            className="control-button skip-button"
                            aria-label="Avançar 10 segundos"
                        >
                            <RefreshCcw size={18} style={{ transform: 'scaleX(-1)' }}/>
                            <span style={{fontSize: '10px'}}>+10</span>
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => skipTrack(1)}
                        className="control-button"
                        aria-label="Próximo vídeo"
                    >
                        <SkipForward size={24} />
                    </button>
                    
                    <div 
                        className="volume-control-group"
                        onMouseEnter={() => setIsVolumeControlVisible(true)}
                        onMouseLeave={() => setIsVolumeControlVisible(false)}
                    >
                        <div 
                            className="control-button volume-button-icon"
                            onClick={handleMuteToggle}
                        >
                            <VolumeIcon size={24} />
                        </div>

                        {isVolumeControlVisible && (
                            <div className="vertical-volume-slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    style={volumeBarStyle}
                                />
                                <p className="volume-percent-text">{displayVolumePercent}%</p>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={toggleFullscreen}
                        className="control-button"
                        aria-label="Tela cheia"
                    >
                        <Maximize size={24} />
                    </button>
                </div>
            </div>
            
            <div className="music-list-container">
                <h2>Lista de Vídeos</h2>
                <ul className="music-list">
                    {videos.map((video, index) => (
                        <li 
                            key={video.name} 
                            className={`music-item ${index === currentTrackIndex ? 'active' : ''}`}
                            onClick={() => selectTrack(index)}
                            role="button" 
                            tabIndex={0} 
                        >
                            <span className="track-number">{index + 1}.</span>
                            <div className="track-details">
                                <p className="track-name">{video.name}</p>
                                <p className="track-author">{video.autor}</p>
                            </div>
                            {index === currentTrackIndex && isPlaying && !isLoading && (
                                <span className="playing-indicator"></span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}