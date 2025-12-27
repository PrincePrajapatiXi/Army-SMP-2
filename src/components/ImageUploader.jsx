import React, { useState, useRef } from 'react';
import { Upload, X, Image, Loader, Check } from 'lucide-react';
import './ImageUploader.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ImageUploader = ({ value, onChange, placeholder = "Drag & drop image or click to upload" }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);

            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            setUploadProgress(100);

            // Call onChange with the new URL
            onChange(data.url);

            // Reset after success
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);

        } catch (err) {
            console.error('Upload error:', err);
            setError('Upload failed. Please try again.');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClear = () => {
        onChange('');
        setError(null);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="image-uploader-container">
            <div
                className={`image-uploader ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''} ${value ? 'has-image' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {isUploading ? (
                    <div className="upload-progress">
                        <Loader className="spinner" size={32} />
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span>Uploading... {uploadProgress}%</span>
                    </div>
                ) : value ? (
                    <div className="image-preview">
                        <img src={value} alt="Preview" />
                        <div className="preview-overlay">
                            <Check size={24} className="success-icon" />
                            <span>Click to change</span>
                        </div>
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <div className="upload-icon">
                            <Upload size={32} />
                        </div>
                        <span className="upload-text">{placeholder}</span>
                        <span className="upload-hint">PNG, JPG, GIF up to 5MB</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="upload-error">
                    <X size={14} />
                    <span>{error}</span>
                </div>
            )}

            {/* Manual URL input as fallback */}
            <div className="url-fallback">
                <Image size={14} />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Or paste image URL..."
                />
            </div>
        </div>
    );
};

export default ImageUploader;
