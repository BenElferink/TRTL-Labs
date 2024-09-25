import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/utils/mongo';

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;

  const client = await clientPromise;
  const db = client.db('TRTL');
  const collection = db.collection('turtle-syndicate-wallets');

  try {
    switch (method) {
      case 'GET': {
        // Fetch all documents from the collection
        const docs = await collection.find({}).toArray();
        const mapped = docs.map((d) => ({ ...d, id: d._id }));
        
        return res.status(200).json({
          count: mapped.length,
          items: mapped,
        });
      }

      case 'POST': {
        const { id } = query;
        const { cardano, solana } = body;

        if (!!cardano && !!solana) {
          // Find documents matching both `cardano` and `solana` fields
          const docs = await collection.find({ cardano, solana }).toArray();
          console.log(docs)

          if (docs.length) {
            return res.status(200).json({
              count: docs.length,
              items: docs.map((d) => ({ ...d, id: d._id })),
            });
          }
        } else if (!!cardano) {
          // Find documents matching only the `cardano` field
          const docs = await collection.find({ cardano }).toArray();

          if (docs.length) {
            return res.status(200).json({
              count: docs.length,
              items: docs.map((d) => ({ ...d, id: d._id })),
            });
          }
        } else if (!!solana) {
          // Find documents matching only the `solana` field
          const docs = await collection.find({ solana }).toArray();

          if (docs.length) {
            return res.status(200).json({
              count: docs.length,
              items: docs.map((d) => ({ ...d, id: d._id })),
            });
          }
        }

        // for mobile wallets
        if (!!id) {
          const docId = id as string;

          // Find the document by ID and update it
          const updateParams: Partial<{ cardano: string; solana: string }> = {};
          if (cardano) updateParams['cardano'] = cardano;
          if (solana) updateParams['solana'] = solana;

          const result = await collection.findOneAndUpdate(
            { _Id: docId },
            { $set: updateParams }
          );

          if (!result?.value) return res.status(400).end('Bad ID');

          return res.status(201).json({
            count: 1,
            items: [{ id: result.value._id, cardano, solana }],
          });
        }

        // Add a new document to the collection
        const result = await collection.insertOne({ cardano, solana },);
        return res.status(201).json({
          count: 1,
          items: [{ id: result.insertedId, cardano, solana }],
        });
      }

      case 'DELETE': {
        const { id } = query;
        console.log('DELETE API CALL - ID:',id)

        if (!!id && typeof id === 'string') {
          // Delete the document with the specified ID
          await collection.deleteOne({ _Id: id });
        }

        return res.status(204).end();
      }

      default: {
        res.setHeader('Allow', 'GET');
        res.setHeader('Allow', 'POST');
        res.setHeader('Allow', 'DELETE');
        return res.status(405).end();
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
};

export default handler;
