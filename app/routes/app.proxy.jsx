import db from "../db.server";

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const productId = url.searchParams.get("productId");

    const createResponse = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
            status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        });
    };

    if (!shop) return createResponse({ error: "Shop missing" }, 400);

    try {
        // 1. Fetch Settings
        const settings = await db.appSettings.findUnique({ where: { shop } });
        const defaultSettings = settings || {
            primaryColor: '#000000',
            buttonText: 'Add to Bag',
            showViews: true,
            showRating: true,
            autoplay: true,
            borderRadius: 12,
            layoutType: 'slider',
            enableGradient: true,
            floatingPlayerVisible: true,
            displayLocation: 'both'
        };

        // 2. Fetch Latest Reels (Backup for all scenarios)
        const latestReels = await db.reel.findMany({
            where: { shop, isLive: true },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        const isProductPage = productId && productId !== "null" && productId !== "" && productId !== "undefined";

        if (isProductPage) {
            // Context: Product Page
            let productReel = await db.reel.findFirst({
                where: { shop, productId, isLive: true }
            });

            // FALLBACK: Agar product specific reel nahi hai, toh latest reel dikhao
            return createResponse({
                reel: productReel || (latestReels.length > 0 ? latestReels[0] : null),
                reels: latestReels,
                settings: defaultSettings
            });
        } else {
            // Context: Home/General
            return createResponse({
                reels: latestReels,
                reel: latestReels.length > 0 ? latestReels[0] : null,
                settings: defaultSettings
            });
        }

    } catch (error) {
        console.error("Proxy Loader Error:", error);
        return createResponse({ error: "Failed to fetch data" }, 500);
    }
};

export const action = async ({ request }) => {
    const createResponse = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
            status,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    };

    try {
        const body = await request.json();
        const { reelId, intent, isLiked } = body;
        if (!reelId) return createResponse({ error: "Reel ID missing" }, 400);

        const id = parseInt(reelId);

        if (intent === "toggle_like") {
            const updated = await db.reel.update({
                where: { id },
                data: { likes: isLiked ? { decrement: 1 } : { increment: 1 } },
            });
            return createResponse({ success: true, likes: updated.likes });
        }

        if (intent === "increment_views") {
            const updated = await db.reel.update({
                where: { id },
                data: { views: { increment: 1 } },
            });
            return createResponse({ success: true, views: updated.views });
        }

        return createResponse({ error: "Invalid intent" }, 400);
    } catch (e) {
        return createResponse({ error: "Update failed" }, 500);
    }
};