import React from 'react';

type Props = {
    extension: string;
    type: string;
    className?: string;
};

const getColorPalette = (type: string, extension: string) => {
    const ext = extension.toLowerCase();
    if (ext === 'pdf') return { base: '#E5252A', dark: '#B71D21' }; // Red
    
    switch (type) {
        case 'image':
            return { base: '#10B981', dark: '#047857' }; // Emerald
        case 'video':
            return { base: '#6366F1', dark: '#4338CA' }; // Indigo
        case 'audio':
            return { base: '#F59E0B', dark: '#B45309' }; // Amber
        case 'document':
            return { base: '#3B82F6', dark: '#1D4ED8' }; // Blue
        default:
            return { base: '#64748B', dark: '#334155' }; // Slate
    }
};

export const DynamicFileIcon = ({ extension, type, className }: Props) => {
    const { base, dark } = getColorPalette(type, extension);
    const extText = (extension || type || 'file').slice(0, 4).toUpperCase();

    return (
        <svg
            className={className}
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Document Body */}
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.1698 0H26.7166L38.6745 11.9602V34.9274C38.6745 37.7163 36.3931 40 33.602 40H13.1699C10.381 40 8.09961 37.7163 8.09961 34.9274V5.07258C8.09961 2.28367 10.381 0 13.1698 0Z"
                fill={base}
            />
            {/* Top Right Fold */}
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M26.7168 0L38.6748 11.9602H28.0061C27.2952 11.9602 26.7168 11.3796 26.7168 10.6687V0Z"
                fill={dark}
            />
            {/* Badge Background */}
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.4375 17.0328H29.9858C30.5984 17.0328 31.0991 17.5334 31.0991 18.1461V28.2523C31.0991 28.865 30.5984 29.3656 29.9858 29.3656H2.4375C1.82484 29.3656 1.32422 28.865 1.32422 28.2523V18.1461C1.32422 17.5334 1.82492 17.0328 2.4375 17.0328Z"
                fill={dark}
            />
            {/* Extension Text */}
            <text
                x="16.2"
                y="26.5"
                fontSize="8.5"
                fontWeight="800"
                fill="white"
                textAnchor="middle"
                fontFamily="sans-serif"
                letterSpacing="0.5"
            >
                {extText}
            </text>
        </svg>
    );
};
