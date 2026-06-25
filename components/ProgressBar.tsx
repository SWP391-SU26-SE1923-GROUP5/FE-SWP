import React from "react";

type Props = {
    value: number;
};

const ProgressBar = ({ value }: Props) => {
    return (
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
                className="bg-brand h-full rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${value}%` }}
            />
        </div>
    );
};

export default ProgressBar;