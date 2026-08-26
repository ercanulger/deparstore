export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

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
    } = req.body || {};

    if (!price || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir ürün fiyatı belirtilmelidir.',
      });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID || '460280';
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID || '2059055';

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Lemon Squeezy API anahtarı yapılandırılmamış.',
      });
    }

    const customPriceInCents = Math.round(Number(price) * 100);
    const formattedOrderId = orderId || `ORD-${Date.now()}`;
    const successRedirectUrl =
      redirectUrl ||
      `https://deparstore.me/odeme-basarili?order_id=${encodeURIComponent(formattedOrderId)}`;

    const customData: Record<string, string> = {
      order_id: String(formattedOrderId),
      product_id: String(productId || ''),
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
        type: 'checkouts',
        attributes: {
          custom_price: customPriceInCents,
          product_options: {
            name: title || 'DeparStore Dijital Lisans / Ürün',
            description: `DeparStore - ${title || 'Dijital Ürün'} (Sipariş No: ${formattedOrderId})`,
            redirect_url: successRedirectUrl,
            receipt_button_text: 'Sipariş Takibine Dön',
            receipt_link_url: successRedirectUrl,
          },
          checkout_data: checkoutDataObj,
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantId),
            },
          },
        },
      },
    };

    const lemonResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify(payload),
    });

    const responseData: any = await lemonResponse.json();

    if (!lemonResponse.ok) {
      const errorMsg =
        responseData?.errors?.[0]?.detail ||
        responseData?.errors?.[0]?.title ||
        'Lemon Squeezy ödeme bağlantısı oluşturulamadı.';
      return res.status(lemonResponse.status).json({
        success: false,
        error: errorMsg,
        details: responseData,
      });
    }

    const checkoutUrl = responseData?.data?.attributes?.url;

    if (!checkoutUrl) {
      return res.status(500).json({
        success: false,
        error: 'Ödeme bağlantısı adresi alınamadı.',
      });
    }

    return res.json({
      success: true,
      url: checkoutUrl,
      orderId: formattedOrderId,
      price: Number(price),
      customPriceInCents,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Ödeme bağlantısı oluşturulurken sunucu hatası oluştu.',
    });
  }
}
