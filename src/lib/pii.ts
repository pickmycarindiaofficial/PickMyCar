/**
 * PIIUtility - Utility for masking Personally Identifiable Information
 * to prevent data leakage in logs and telemetry.
 */
export const PIIUtility = {
    /**
     * Mask email address (e.g., u***r@example.com)
     */
    maskEmail: (email?: string): string => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        if (!domain) return '***';
        const maskedName = name.length > 2
            ? `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
            : '***';
        return `${maskedName}@${domain}`;
    },

    /**
     * Mask phone number (e.g., +91 ******7890)
     */
    maskPhone: (phone?: string): string => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 4) return '***';
        return `******${cleaned.slice(-4)}`;
    },

    /**
     * Mask full name (e.g., J*** D***)
     */
    maskName: (name?: string): string => {
        if (!name) return '';
        return name
            .split(' ')
            .map(part => part.length > 1 ? `${part[0]}${'*'.repeat(part.length - 1)}` : '*')
            .join(' ');
    },

    /**
     * General purpose masker for strings
     */
    maskString: (str?: string, visibleChars: number = 2): string => {
        if (!str) return '';
        if (str.length <= visibleChars) return '*'.repeat(str.length);
        return `${str.slice(0, visibleChars)}${'*'.repeat(str.length - visibleChars)}`;
    }
};

export default PIIUtility;
