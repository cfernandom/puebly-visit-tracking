export interface IPostInteractionLog {
    hmac: string;
    uuid: string;
    post_id: number;
    type: 'call' | 'location' | 'whatsapp';
}