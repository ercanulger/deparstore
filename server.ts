import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env.local and .env
dotenv.config({ path: ".env.local" });
dotenv.config();

// Default Lemon Squeezy Credentials
const DEFAULT_LEMON_API_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJmM2I5OGRjNTY2N2M1NmQ0Y2I0MzA1YWFkMzY1ZmM5OTU2NjYzNGU1NTNlYjc5OThiZGI3NjY2M2M3NzExMTUzMDkxOGI3ZDkwMDA2ZjA3MyIsImlhdCI6MTc4NzcxMDY1MC4zMTQwMTcsIm5iZiI6MTc4NzcxMDY1MC4zMTQwMiwiZXhwIjoxODAzNjAwMDAwLjAyNTgzMiwic3ViIjoiNzgzOTcyOSIsInNjb3BlcyI6W119.Xtz0K3bO5qtEijcLJgTqJ28E4Ka4GC7GOiJPc6a42ia9xyK0QIdRLGiCag6bgq-vn7HOvTltuxl8I2ycGFCvl7n-gVHGbfK03-1WSHZmFwUdgfaf1IxUKfK718ZqQhptdizqXFdS7Bm7PovWREnV9WTV_js-QUomGL_bKgGd-lLmCyfQ9YagGDzKvqb04Zzd3jxtt2ZXJIAwPhwRT1BS88qsOGKoEt_2zPpLJcUJGbIyWDUk2l1kooCuhMrZ9ZnW1QYdOgM9HqelBL1XOvn04s28KUU3bLEIqolDwrGRAaafIDOH4bsdjRoOacOE97zEOJjQGCYXi4ZOaoinH_j-gF4KsrSFQ7L6pShmcXVCjQVuOzqO2ADjz210Ctubrc_VxoAceWBvdQn1_Oz06H1eHaYvcRgcap5snTXdaAt__Ywr9hawYcRged6Cu542Tp-lhQ0U5XR9M7zK4wUvG_gmCgOXHpPIpV_iyKVsFVIlpWNKe2kz70XNMJWnAvmikMzxghcAijehpSGSdsSMV05bjyzl_OrxE2cjGwc7IvVb23RG1v7DmVnLE8GFT5MGnFz5VBHgm29zTcOmf8g0uteEJE5sT3FwiPsyirOstyI0XnAj07W7kGOjfc_UpDS7aNmpKVGVVnHeql3R86Pie7ceecfbNcH9mMESCxMBp_i-olo";
const DEFAULT_STORE_ID = "460280";
const DEFAULT_VARIANT_ID = "2059055";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for capturing raw body for webhook verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // API Health Endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      storeId: process.env.LEMON_SQUEEZY_STORE_ID ? "configured" : "missing",
      variantId: process.env.LEMON_SQUEEZY_VARIANT_ID ? "configured" : "missing",
    });
  });

  // Lemon Squeezy Dynamic Checkout API
  app.post("/api/checkout", async (req, res) => {
    try {
      const {
        productId,
        title,
        price,
        customerEmail,
        customerName,
        customerPhone,
        orderId,
        redirectUrl,
      } = req.body;

      if (!price || Number(price) <= 0) {
        return res.status(400).json({
          success: false,
          error: "Geçerli bir ürün fiyatı belirtilmelidir.",
        });
      }

      const apiKey = process.env.LEMON_SQUEEZY_API_KEY || DEFAULT_LEMON_API_KEY;
      const storeId = (process.env.LEMON_SQUEEZY_STORE_ID || DEFAULT_STORE_ID).replace("#", "").trim();
      const variantId = (process.env.LEMON_SQUEEZY_VARIANT_ID || DEFAULT_VARIANT_ID).replace("#", "").trim();

      if (!apiKey || apiKey.trim() === "") {
        console.error("LEMON_SQUEEZY_API_KEY is missing.");
        return res.status(500).json({
          success: false,
          error: "Lemon Squeezy API anahtarı yapılandırılmamış.",
        });
      }

      // Convert price to cents / kuruş (price * 100)
      const customPriceInCents = Math.round(Number(price) * 100);
      const formattedOrderId = orderId || `ORD-${Date.now()}`;
      
      const successRedirectUrl =
        redirectUrl ||
        `https://deparstore.me/odeme-basarili?order_id=${encodeURIComponent(formattedOrderId)}`;

      // Build custom data safely without undefined/null fields
      const customData: Record<string, string> = {
        order_id: String(formattedOrderId),
        product_id: String(productId || ""),
        price: String(price),
      };
      if (customerName && String(customerName).trim()) {
        customData.customer_name = String(customerName).trim();
      }
      if (customerEmail && String(customerEmail).trim()) {
        customData.customer_email = String(customerEmail).trim();
      }
      if (customerPhone && String(customerPhone).trim()) {
        customData.customer_phone = String(customerPhone).trim();
      }

      const checkoutDataObj: any = {
        custom: customData,
      };
      if (customerEmail && String(customerEmail).trim()) {
        checkoutDataObj.email = String(customerEmail).trim();
      }
      if (customerName && String(customerName).trim()) {
        checkoutDataObj.name = String(customerName).trim();
      }

      const payload = {
        data: {
          type: "checkouts",
          attributes: {
            custom_price: customPriceInCents,
            product_options: {
              name: title || "DeparStore Dijital Ürün",
              description: `DeparStore Sipariş No: ${formattedOrderId}`,
              redirect_url: successRedirectUrl,
            },
            checkout_data: {
              email: customerEmail && String(customerEmail).trim() ? String(customerEmail).trim() : undefined,
              name: customerName && String(customerName).trim() ? String(customerName).trim() : undefined,
              custom: {
                order_id: String(formattedOrderId),
                product_id: String(productId || ""),
              },
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: String(storeId),
              },
            },
            variant: {
              data: {
                type: "variants",
                id: String(variantId),
              },
            },
          },
        },
      };

      console.log(`Creating Lemon Squeezy checkout for ${title} (${price} TL / ${customPriceInCents} cents)...`);

      const lemonResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify(payload),
      });

      const responseData: any = await lemonResponse.json();

      if (!lemonResponse.ok) {
        console.error("Lemon Squeezy API Error:", responseData);
        const errorMsg =
          responseData?.errors?.[0]?.detail ||
          responseData?.errors?.[0]?.title ||
          "Lemon Squeezy ödeme bağlantısı oluşturulamadı.";
        return res.status(lemonResponse.status).json({
          success: false,
          error: errorMsg,
          details: responseData,
        });
      }

      const checkoutUrl = responseData?.data?.attributes?.url;

      if (!checkoutUrl) {
        console.error("Lemon Squeezy did not return checkout URL:", responseData);
        return res.status(500).json({
          success: false,
          error: "Ödeme bağlantısı adresi alınamadı.",
        });
      }

      console.log(`Checkout URL successfully generated: ${checkoutUrl}`);

      return res.json({
        success: true,
        url: checkoutUrl,
        orderId: formattedOrderId,
        price: Number(price),
        customPriceInCents,
      });
    } catch (err: any) {
      console.error("Unexpected checkout error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Ödeme bağlantısı oluşturulurken sunucu hatası oluştu.",
      });
    }
  });

  // Lemon Squeezy Webhook Listener
  app.post("/api/webhook", async (req: any, res) => {
    try {
      const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "depar_secret_key_2026";
      const signatureHeader = req.get("X-Signature") || "";

      // Signature verification with crypto timing safe equal
      if (req.rawBody && signatureHeader) {
        const hmac = crypto.createHmac("sha256", webhookSecret);
        const digest = Buffer.from(hmac.update(req.rawBody).digest("hex"), "utf8");
        const signature = Buffer.from(signatureHeader, "utf8");

        if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
          console.warn("Lemon Squeezy webhook signature verification failed.");
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      }

      const event = req.body;
      const eventName = event?.meta?.event_name;
      const customData = event?.meta?.custom_data;
      const orderId = customData?.order_id;

      console.log(`[Lemon Squeezy Webhook] Received Event: ${eventName}`, {
        orderId,
        customData,
        orderAttributes: event?.data?.attributes,
      });

      // Event handling
      if (eventName === "order_created") {
        console.log(`✅ Order ${orderId || "UNKNOWN"} paid successfully via Lemon Squeezy!`);
      }

      return res.status(200).json({
        received: true,
        event: eventName,
        orderId: orderId || null,
      });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return res.status(500).json({ error: "Internal webhook error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DeparStore server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
