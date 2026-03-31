export async function computeSHA256(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computePerceptualHash(file) {
    if (!file.type.startsWith('image/')) {
        // Fallback for non-images: use a slightly different SHA-256 variant or truncated hash
        const sha = await computeSHA256(file);
        return 'p-' + sha.slice(0, 16);
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 8;
                canvas.height = 8;
                ctx.drawImage(img, 0, 0, 8, 8);
                const imageData = ctx.getImageData(0, 0, 8, 8).data;
                
                let gray = [];
                for (let i = 0; i < imageData.length; i += 4) {
                    gray.push(Math.floor((imageData[i] + imageData[i+1] + imageData[i+2]) / 3));
                }
                
                const avg = gray.reduce((a, b) => a + b) / gray.length;
                const hash = gray.map(g => (g >= avg ? '1' : '0')).join('');
                // Convert bit string to hex
                let hex = '';
                for (let i = 0; i < hash.length; i += 4) {
                    hex += parseInt(hash.substr(i, 4), 2).toString(16);
                }
                resolve(hex);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

export function generateCID(sha256) {
    // Mock CID generation (v1 format prefix + sha256)
    return 'bafybeig' + sha256.slice(0, 42);
}
