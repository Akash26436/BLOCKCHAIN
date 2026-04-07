/**
 * Mock IPFS Service for realistic project demonstrations.
 * In a production environment, this would use a pinning service like Pinata or a local Kubo node.
 */
export const ipfsService = {
    upload: async (file) => {
        console.log(`[IPFS] Mock uploading file: ${file.name}...`);
        
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate a realistic CIDv1 (Mock)
        const randomString = Math.random().toString(36).substring(2, 15);
        const cid = `bafybeig${randomString}abcdefghijklmnopqrstuvwxyz`;
        
        console.log(`[IPFS] Upload complete! CID: ${cid}`);
        return cid;
    },
    
    getGatewayUrl: (cid) => {
        return `https://ipfs.io/ipfs/${cid}`;
    }
};
