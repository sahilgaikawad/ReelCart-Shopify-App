import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Topic check karna zaroori hai
  switch (topic) {
    case "APP_UNINSTALLED":
      console.log(`Cleaning up data for shop: ${shop}`);

      try {
        // 1. Merchant ki saari Reels delete karo
        await db.reel.deleteMany({ where: { shop } });

        // 2. Merchant ki Settings aur Instagram Token delete karo
        await db.appSettings.deleteMany({ where: { shop } });

        // 3. Shopify Sessions delete karo
        await db.session.deleteMany({ where: { shop } });

        console.log(`Successfully deleted all data for ${shop}`);
      } catch (error) {
        console.error(`Error during uninstallation cleanup for ${shop}:`, error);
      }
      break;

    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      // Ye Mandatory Webhooks hain (Shopify App Store ki requirement)
      // Filhaal bas success response bhej do
      return new Response(null, { status: 200 });

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response();
};