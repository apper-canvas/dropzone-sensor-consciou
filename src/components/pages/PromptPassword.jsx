import { useEffect } from 'react';

const PromptPassword = () => {
    useEffect(() => {
        const { ApperUI } = window.ApperSDK;
        ApperUI.showPromptPassword('#authentication-prompt-password');
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <div id="authentication-prompt-password"></div>
            </div>
        </div>
    );
};

export default PromptPassword;