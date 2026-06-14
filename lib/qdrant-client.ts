import {QdrantClient} from '@qdrant/js-client-rest';

export const qdrant = new QdrantClient({
    url: 'https://dcf10ac1-3a44-49f5-9fd8-e161f3195a7e.us-west-1-0.aws.cloud.qdrant.io:6333',
    apiKey: process.env.QDRANT_API_KEY,
});

export const QDRANT_COLLECTION_NAME = 'smartstore';

try {
    const result = await qdrant.getCollections();
    console.log('List of collections:', result.collections);
} catch (err) {
    console.error('Could not get collections:', err);
}