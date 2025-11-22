'use client'; 

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Play, Pause, Volume2, VolumeX, 
    SkipBack, SkipForward, RefreshCcw, Maximize 
} from 'lucide-react'; 
import './globals.css';

const formatTime = (timeInSeconds: number) => {
    if (Number.isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
};


export default function VideoPlayerSimulator() {
    // --- ESTADOS ---
    const [isPlaying, setIsPlaying] = useState<boolean>(false); 
    const [volume, setVolume] = useState<number>(0.5); 
    const [isVolumeControlVisible, setIsVolumeControlVisible] = useState<boolean>(false);
    const [lastVolume, setLastVolume] = useState<number>(0.5); 
    
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0); 
    
    const videoRef = useRef<HTMLVideoElement>(null); 


    const playVideo = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            video.volume = volume;
            video.play().catch(error => console.error("Falha ao reproduzir o vídeo:", error));
            setIsPlaying(true);
        }
    }, [volume]);
    
    const handlePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            if (isPlaying) {
                video.pause();
                setIsPlaying(false);
            } else {
                playVideo();
            }
        }
    }, [isPlaying, playVideo]);

    const handleSkip10Seconds = useCallback((seconds: 10 | -10) => {
        const video = videoRef.current;
        if (video) {
            video.currentTime += seconds;
        }
    }, []);

    const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number.parseFloat(event.target.value); 
        setVolume(newVolume);
        
        const video = videoRef.current;
        if (video) {
            video.volume = newVolume;
        }
        
        if (newVolume > 0) {
            setLastVolume(newVolume);
        }
    }, []);

    const handleMuteToggle = useCallback(() => {
        const video = videoRef.current;
        
        if (volume > 0) {
            setLastVolume(volume);
            setVolume(0);
            if (video) video.volume = 0;
        } else {
            const restoredVolume = lastVolume > 0 ? lastVolume : 0.5;
            setVolume(restoredVolume);
            if (video) video.volume = restoredVolume;
        }
    }, [volume, lastVolume]);

    const handleSeekChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = Number.parseFloat(event.target.value);
        setCurrentTime(seekTime);
        const video = videoRef.current;
        if (video) {
            video.currentTime = seekTime;
        }
    }, []);

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (video) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                video.requestFullscreen();
            }
        }
    };


    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        

        const setVideoData = () => setDuration(video.duration);
        const setVideoTime = () => setCurrentTime(video.currentTime);
        const handleVideoEnd = () => setIsPlaying(false); 

        video.addEventListener('loadedmetadata', setVideoData);
        video.addEventListener('timeupdate', setVideoTime);
        video.addEventListener('ended', handleVideoEnd);

        setVolume(0.5); 
        setLastVolume(0.5);
        setIsPlaying(false);

        return () => {
            video.removeEventListener('loadedmetadata', setVideoData);
            video.removeEventListener('timeupdate', setVideoTime);
            video.removeEventListener('ended', handleVideoEnd);
        };
    }, []); 


    const PlayPauseIcon = isPlaying ? Pause : Play;
    const VolumeIcon = volume === 0 ? VolumeX : Volume2;
    const displayVolumePercent = Math.round(volume * 100);
    

    const progressWidth = (currentTime / duration) * 100;
    const progressBarStyle = {
        '--progress-percent': `${duration > 0 ? progressWidth : 0}%`,
    } as React.CSSProperties;


    const volumeBarStyle = {
        '--volume-percent': `${displayVolumePercent}%`,
    } as React.CSSProperties;


    const safeDuration = Number.isNaN(duration) || duration === 0 ? 0.01 : duration;

    return (

        <div className="main-container video-mode"> 
            

            <div className="player-container video-player-box">
                

                <div className="video-wrapper" onClick={handlePlayPause}>

                    <video 
                        ref={videoRef} 
                        poster="/images/poster.jpg" 
                        className="main-video-element"
                    >

                        <source src="/max.mp4" type="video/mp4" /> 
                        
                        <track kind="captions" src="/captions/empty.vtt" label="Empty" default />
                    </video>
                    

                    {!isPlaying && (
                        <div className="center-play-button">
                            <Play size={60} color="#fff" fill="#fff" />
                        </div>
                    )}
                </div>



                <div className="progress-bar-container">

                    <div className="progress-time">{formatTime(currentTime)}</div> 
                    
                    <div className="progress-bar">

                        <input
                            type="range"
                            min="0"
                            max={safeDuration} 
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
                    >
                        <PlayPauseIcon size={30} color="#fff" fill="#fff" />
                    </button>

                    <button 
                        onClick={() => handleSkip10Seconds(10)}
                        className="control-button skip-button"
                        aria-label="Avançar 10 segundos"
                    >
                        <RefreshCcw size={18} style={{ transform: 'scaleX(-1)' }}/>
                        <span style={{fontSize: '10px'}}>+10</span>
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
        </div>
    );
}