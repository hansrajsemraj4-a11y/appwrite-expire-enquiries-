import { Client, Databases, Query } from "node-appwrite";

export default async ({ res }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const TEN_MINUTES_AGO = new Date(
      Date.now() - 10 * 60 * 1000
    ).toISOString();

    const oldEnquiries = await databases.listDocuments(
      process.env.DB_ID,
      process.env.ENQUIRY_COLLECTION_ID,
      [
        Query.equal("status", "open"),
        Query.lessThan("$createdAt", TEN_MINUTES_AGO),
      ]
    );

    for (const enquiry of oldEnquiries.documents) {
      await databases.updateDocument(
        process.env.DB_ID,
        process.env.ENQUIRY_COLLECTION_ID,
        enquiry.$id,
        {
          status: "expired",
          expiredAt: new Date().toISOString(),
        }
      );
    }

    return res.json({
      success: true,
      expiredCount: oldEnquiries.documents.length,
    });
  } catch (err) {
    console.log("Expiry function error:", err);
    return res.json({ success: false });
  }
};
