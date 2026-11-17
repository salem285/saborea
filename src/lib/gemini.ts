import { GoogleGenAI, Type } from "@google/genai";

export interface ConciergeMenuItemSummary {
  id: string;
  name: string;
  price: number;
  category: string;
  sold?: number;
}

export interface ConciergeRecommendationResponse {
  thought: string;
  reply: string;
  recommendedDishIds: string[];
  quickFollowUps: string[];
  isFallback?: boolean;
}

export interface DishCreatorResponse {
  name: string;
  category: "pizza" | "savory" | "sweets" | "drinks";
  price: number;
  description: string;
  pairingTip: string;
  isFallback?: boolean;
}

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export function getGeminiClient(customApiKey?: string | null): GoogleGenAI | null {
  const apiKey =
    customApiKey?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Intelligent culinary recommendation using Gemini API
 */
export async function generateCulinaryRecommendation(params: {
  message: string;
  menu: ConciergeMenuItemSummary[];
  cartItemNames?: string[];
  apiKey?: string | null;
}): Promise<ConciergeRecommendationResponse> {
  const { message, menu, cartItemNames = [], apiKey } = params;
  const client = getGeminiClient(apiKey);

  // If no Gemini API key is configured yet, provide a rich, curated sommelier answer
  if (!client) {
    return generateLocalFallbackRecommendation(message, menu, cartItemNames);
  }

  const menuContext = menu
    .map(
      (m) =>
        `- ID: "${m.id}" | Name: "${m.name}" | Category: ${m.category} | Price: ${m.price} EGP (Popularity sold: ${m.sold ?? 0})`
    )
    .join("\n");

  const systemInstruction = `You are the Chef Sommelier and Master Culinary Host at SABOREA, an upscale artisan bakery and Mediterranean restaurant known for delicate crusts, rich truffles, handcrafted pasta, decadent sweets, and refreshing pairings.

Current Restaurant Menu:
${menuContext}

Current Guest Cart: ${cartItemNames.length > 0 ? cartItemNames.join(", ") : "Empty cart (starting fresh)"}

Instructions:
1. Speak in a warm, welcoming, sensory, and knowledgeable tone (like a gracious sommelier / head chef).
2. Recommend 1 to 3 items from the menu that perfectly match the guest's inquiry, taste mood, dietary preference, or pairing request.
3. Crucially: ONLY recommend dish IDs that exist in the provided menu list above.
4. Keep the reply engaging, concise (2-4 sentences), and appetizing. Highlight flavors, textures, or pairing harmonies.
5. Provide 2-3 short, relevant quick follow-up questions the guest might want to ask next.`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: message,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thought: {
                type: Type.STRING,
                description: "Brief internal sommelier pairing logic.",
              },
              reply: {
                type: Type.STRING,
                description: "Appetizing culinary response to the guest.",
              },
              recommendedDishIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of matching menu item IDs from the list.",
              },
              quickFollowUps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 short follow-up prompts.",
              },
            },
            required: ["reply", "recommendedDishIds", "quickFollowUps"],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as ConciergeRecommendationResponse;
        // Validate recommended IDs exist in menu
        const validIds = (parsed.recommendedDishIds || []).filter((id) =>
          menu.some((m) => m.id === id)
        );
        return {
          thought: parsed.thought || "Culinary pairing curated by Gemini.",
          reply: parsed.reply,
          recommendedDishIds: validIds.length > 0 ? validIds : [menu[0]?.id || "classic-margherita"],
          quickFollowUps: parsed.quickFollowUps || [
            "What drink pairs with this?",
            "Any sweet dessert recommendations?",
          ],
        };
      }
    } catch (err: unknown) {
      console.warn(`Gemini model ${model} call failed:`, err);
      // Try next candidate model
    }
  }

  // Fallback if all models failed (e.g. invalid key or network issue)
  return generateLocalFallbackRecommendation(message, menu, cartItemNames);
}

/**
 * Creative Dish Idea Creator for Admin using Gemini API
 */
export async function generateDishIdea(params: {
  prompt: string;
  apiKey?: string | null;
}): Promise<DishCreatorResponse> {
  const { prompt, apiKey } = params;
  const client = getGeminiClient(apiKey);

  if (!client) {
    return generateLocalFallbackDishIdea(prompt);
  }

  const systemInstruction = `You are the Executive Development Chef for SABOREA, a boutique Mediterranean bakery & restaurant.
Given an ingredient idea, culinary concept, or rough dish name, craft a cohesive menu item matching Saborea's artisan identity.
The currency is EGP (Egyptian Pounds). Typical prices: Pizza 240-350 EGP, Savory Mains 280-450 EGP, Sweets 120-190 EGP, Drinks 35-85 EGP.
Categories must strictly be one of: 'pizza', 'savory', 'sweets', 'drinks'.`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: `Create a signature Saborea dish based on: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Elegant menu title" },
              category: {
                type: Type.STRING,
                description: "Must be 'pizza', 'savory', 'sweets', or 'drinks'",
              },
              price: { type: Type.NUMBER, description: "Price in EGP" },
              description: {
                type: Type.STRING,
                description: "Mouth-watering 1-2 sentence culinary description.",
              },
              pairingTip: {
                type: Type.STRING,
                description: "Suggested drink or side pairing.",
              },
            },
            required: ["name", "category", "price", "description", "pairingTip"],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        const validCategories: DishCreatorResponse["category"][] = [
          "pizza",
          "savory",
          "sweets",
          "drinks",
        ];
        const category = validCategories.includes(parsed.category)
          ? parsed.category
          : "savory";

        return {
          name: parsed.name || prompt,
          category,
          price: Number(parsed.price) || 280,
          description: parsed.description || "Artisan preparation by Saborea.",
          pairingTip: parsed.pairingTip || "Pairs wonderfully with a cold beverage.",
        };
      }
    } catch (err: unknown) {
      console.warn(`Gemini dish-creator model ${model} failed:`, err);
    }
  }

  return generateLocalFallbackDishIdea(prompt);
}

/**
 * High-quality culinary heuristics fallback when API key is pending
 */
function generateLocalFallbackRecommendation(
  message: string,
  menu: ConciergeMenuItemSummary[],
  cartItemNames: string[]
): ConciergeRecommendationResponse {
  const query = message.toLowerCase();

  if (query.includes("drink") || query.includes("pair") || query.includes("wine") || query.includes("beverage")) {
    const salmonOrPasta = menu.find((m) => m.id === "truffle-tagliatelle" || m.id === "herb-salmon");
    const lemonMint = menu.find((m) => m.id === "lemon-mint");
    return {
      thought: "Pairing rich savory notes with bright citrus & mint aromatics.",
      reply: "To cut through the richness of our handmade dishes, our Fresh Lemon Mint offers a crisp, refreshing palate cleanser that elevates every bite.",
      recommendedDishIds: [lemonMint?.id || "lemon-mint", salmonOrPasta?.id || "truffle-tagliatelle"],
      quickFollowUps: ["What about something sweet after?", "Recommend a light savory lunch."],
      isFallback: true,
    };
  }

  if (query.includes("sweet") || query.includes("dessert") || query.includes("chocolate") || query.includes("cake")) {
    const lavaCake = menu.find((m) => m.id === "molten-lava-cake");
    const tiramisu = menu.find((m) => m.id === "classic-tiramisu");
    return {
      thought: "Recommending iconic artisan desserts with contrasting profiles.",
      reply: "Indulge in our Molten Lava Cake with its decadent warm Belgian chocolate center, or savor the light, espresso-soaked layers of our Classic Tiramisu.",
      recommendedDishIds: [lavaCake?.id || "molten-lava-cake", tiramisu?.id || "classic-tiramisu"],
      quickFollowUps: ["Which drink pairs with lava cake?", "Can I see your savory pizzas?"],
      isFallback: true,
    };
  }

  if (query.includes("date") || query.includes("two") || query.includes("romantic") || query.includes("dinner")) {
    const tagliatelle = menu.find((m) => m.id === "truffle-tagliatelle");
    const margherita = menu.find((m) => m.id === "classic-margherita");
    const tiramisu = menu.find((m) => m.id === "classic-tiramisu");
    return {
      thought: "Curating a harmonious 2-person dinner pairing.",
      reply: "For an unforgettable dinner for two, share the aromatic Black Truffle Tagliatelle followed by a wood-fired Classic Margherita, finishing with Classic Tiramisu.",
      recommendedDishIds: [
        tagliatelle?.id || "truffle-tagliatelle",
        margherita?.id || "classic-margherita",
        tiramisu?.id || "classic-tiramisu",
      ],
      quickFollowUps: ["What drinks pair with this dinner?", "Show me sweets."],
      isFallback: true,
    };
  }

  if (query.includes("pizza") || query.includes("crust")) {
    const margherita = menu.find((m) => m.id === "classic-margherita");
    const pepperoni = menu.find((m) => m.id === "pepperoni-supreme");
    return {
      thought: "Highlighting slow-fermented artisan crust pizzas.",
      reply: "Our sourdough crust is fermented for 48 hours for an airy, blistered cornicione. Choose the fresh herb simplicity of Margherita or bold Pepperoni Supreme.",
      recommendedDishIds: [margherita?.id || "classic-margherita", pepperoni?.id || "pepperoni-supreme"],
      quickFollowUps: ["What drinks go with pizza?", "Recommend a dessert."],
      isFallback: true,
    };
  }

  // Default recommendation
  const salmon = menu.find((m) => m.id === "herb-salmon");
  const lava = menu.find((m) => m.id === "molten-lava-cake");
  return {
    thought: "Signature Saborea culinary journey recommendation.",
    reply: "Welcome to Saborea! I suggest starting with our Herb-Seared Salmon with seasonal greens, and leaving room for our celebrated Molten Lava Cake.",
    recommendedDishIds: [salmon?.id || "herb-salmon", lava?.id || "molten-lava-cake"],
    quickFollowUps: ["What drinks do you recommend?", "Show me pizza options."],
    isFallback: true,
  };
}

function generateLocalFallbackDishIdea(prompt: string): DishCreatorResponse {
  const p = prompt.toLowerCase();
  if (p.includes("pizza") || p.includes("calzone") || p.includes("crust")) {
    return {
      name: prompt.trim() || "Artisan Truffle & Burrata Pizza",
      category: "pizza",
      price: 330,
      description: "Hand-stretched 48-hour sourdough topped with creamy Fior di Latte, aged parmesan, and aromatic herb oil.",
      pairingTip: "Pairs with chilled sparkling lemonade or iced citrus tea.",
      isFallback: true,
    };
  }
  if (p.includes("sweet") || p.includes("cake") || p.includes("tart") || p.includes("gelato") || p.includes("croissant")) {
    return {
      name: prompt.trim() || "Pistachio Raspberry Tartlet",
      category: "sweets",
      price: 155,
      description: "Crisp almond sable crust filled with Sicilian pistachio ganache and topped with fresh raspberry compote.",
      pairingTip: "Exquisite alongside a rich double espresso.",
      isFallback: true,
    };
  }
  if (p.includes("drink") || p.includes("juice") || p.includes("tea") || p.includes("coffee") || p.includes("cocktail")) {
    return {
      name: prompt.trim() || "Blood Orange & Rosemary Spritz",
      category: "drinks",
      price: 75,
      description: "Freshly squeezed Sicilian blood orange, sparkling mineral water, wild rosemary sprig, and agave nectar.",
      pairingTip: "Ideal companion to our rich savory pasta dishes.",
      isFallback: true,
    };
  }
  return {
    name: prompt.trim() || "Pan-Roasted Mediterranean Branzino",
    category: "savory",
    price: 395,
    description: "Crispy-skin fillet over charred fennel, confit cherry tomatoes, and a bright salsa verde.",
    pairingTip: "Complements our Fresh Lemon Mint perfectly.",
    isFallback: true,
  };
}
