// import removeAccents from 'remove-accents';

// export async function extractSearchIntent(userPrompt) {
//     const API_KEY = process.env.GEMINI_API_KEY;

//     const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

//     const normalizedPrompt = removeAccents(userPrompt.toLowerCase());

//     const prompt = `
// Bạn là AI hỗ trợ tìm kiếm sản phẩm công nghệ.

// Các danh mục sản phẩm:

// - Laptop
// - Điện thoại
// - Máy tính bảng
// - Tai nghe
// - Chuột
// - Bàn phím
// - Màn hình
// - Loa
// - Đồng hồ thông minh

// Hãy phân tích yêu cầu của người dùng và trả về JSON theo định dạng:

// {
//     "category": "",
//     "keywords": [],
//     "minPrice": null,
//     "maxPrice": null
// }

// Ví dụ:

// "Tôi cần laptop gaming dưới 20 triệu"

// {
//     "category":"Laptop",
//     "keywords":["gaming"],
//     "minPrice":null,
//     "maxPrice":20000000
// }

// Yêu cầu người dùng:

// "${normalizedPrompt}"

// Chỉ trả về JSON hợp lệ.
// `;

//     const response = await fetch(URL, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             contents: [
//                 {
//                     parts: [
//                         {
//                             text: prompt,
//                         },
//                     ],
//                 },
//             ],
//         }),
//     });

//     const data = await response.json();

//     const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     const cleanedText = text
//         .replace(/```json/g, '')
//         .replace(/```/g, '')
//         .trim();

//     return JSON.parse(cleanedText);
// }

// export async function rankProducts(userPrompt, products) {
//     const API_KEY = process.env.GEMINI_API_KEY;

//     const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
//     const prompt = `
// Bạn là chuyên gia tư vấn sản phẩm công nghệ.

// Yêu cầu của khách hàng:

// "${userPrompt}"

// Danh sách sản phẩm:

// ${JSON.stringify(products, null, 2)}

// Nhiệm vụ:

// 1. Hiểu ngữ nghĩa tiếng Việt.
// 2. Chọn sản phẩm phù hợp nhất.
// 3. Sắp xếp theo mức độ liên quan.
// 4. Trả về tối đa 10 sản phẩm.
// 5. Chỉ trả về JSON.

// Không giải thích thêm.
// `;

//     const response = await fetch(URL, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             contents: [
//                 {
//                     parts: [
//                         {
//                             text: prompt,
//                         },
//                     ],
//                 },
//             ],
//         }),
//     });
//     const data = await response.json();

//     const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     const cleanedText = text
//         .replace(/```json/g, '')
//         .replace(/```/g, '')
//         .trim();
//     console.log('LINE 139')
//     return JSON.parse(cleanedText);
// }

// ============================================================
// aiSearch.js — AI-powered search utilities (Server-side only)
// ============================================================
// ⚠️  QUAN TRỌNG: File này chỉ được chạy ở backend (Node.js / API route).
//     Không import vào client-side code để tránh lộ API key.
// ============================================================

const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CATEGORY_MAP = {
    Laptop: 'Laptop',
    'Điện thoại': 'Smartphone',
    'Máy tính bảng': 'Tablet',
    'Tai nghe': 'Headphones',
    Chuột: 'Mouse',
    'Bàn phím': 'Keyboard',
    'Màn hình': 'Monitor',
    Loa: 'Speaker',
    'Đồng hồ thông minh': 'Smartwatch',
};
const PRODUCT_CATEGORIES = Object.keys(CATEGORY_MAP);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Gọi Gemini API với prompt cho trước.
 * @param {string} prompt
 * @param {number} timeoutMs - Thời gian chờ tối đa (ms), mặc định 12000
 * @returns {Promise<string>} Raw text từ model
 */
async function callGemini(prompt, timeoutMs = 12_000) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        throw new Error(
            'GEMINI_API_KEY chưa được thiết lập trong biến môi trường.',
        );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2, // Thấp để output ổn định, ít hallucination
                    topP: 0.8,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!response.ok) {
            const errBody = await response.json();
            console.error(
                '[callGemini] Chi tiết lỗi:',
                JSON.stringify(errBody, null, 2),
            );

            const retryDelay = errBody?.error?.details
                ?.find((d) => d['@type']?.includes('RetryInfo'))
                ?.retryDelay?.replace('s', '');

            const error = new Error(`Gemini API lỗi ${response.status}`);
            error.status = response.status;
            error.retryAfterSeconds = retryDelay ? parseInt(retryDelay) : null;
            throw error;
        }

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } finally {
        clearTimeout(timer);
    }
}


/**
 * Làm sạch chuỗi JSON từ Gemini (bỏ markdown code fence nếu có).
 * @param {string} raw
 * @returns {string}
 */
function cleanJSON(raw) {
    return raw
        .replace(/^```(?:json)?/m, '')
        .replace(/```$/m, '')
        .trim();
}

/**
 * Parse JSON an toàn — trả về fallback thay vì throw nếu thất bại.
 * @template T
 * @param {string} text
 * @param {T} fallback
 * @returns {T}
 */
function safeParseJSON(text, fallback) {
    try {
        return JSON.parse(cleanJSON(text));
    } catch (err) {
        console.error(
            '[aiSearch] Không thể parse JSON từ Gemini:',
            err.message,
        );
        console.error('[aiSearch] Raw text:', text);
        return fallback;
    }
}

// ─────────────────────────────────────────────
// Retry wrapper (tối đa 2 lần)
// ─────────────────────────────────────────────

/**
 * Gọi lại hàm async tối đa `maxRetries` lần nếu gặp lỗi.
 * @param {() => Promise<T>} fn
 * @param {number} maxRetries
 * @returns {Promise<T>}
 */
async function withRetry(fn, maxRetries = 2) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            // Nếu là 429, đọc retryDelay từ Gemini và chờ đúng thời gian
            const retrySeconds = err.retryAfterSeconds ?? null;
            if (err.status === 429 && retrySeconds) {
                console.warn(
                    `[aiSearch] Rate limited, chờ ${retrySeconds}s...`,
                );
                await new Promise((r) => setTimeout(r, retrySeconds * 1000));
            } else {
                await new Promise((r) => setTimeout(r, 800 * attempt));
            }
        }
    }
    throw lastError;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Phân tích ý định tìm kiếm từ câu hỏi tiếng Việt của người dùng.
 *
 * @param {string} userPrompt - Câu tìm kiếm tự nhiên của người dùng
 * @returns {Promise<{
 *   category: string,
 *   keywords: string[],
 *   minPrice: number | null,
 *   maxPrice: number | null
 * }>}
 */
export async function extractSearchIntent(userPrompt) {
    const FALLBACK = {
        category: '',
        keywords: [],
        minPrice: null,
        maxPrice: null,
    };

    if (!userPrompt?.trim()) return FALLBACK;

    const prompt = `
Bạn là AI hỗ trợ tìm kiếm sản phẩm công nghệ cho website bán hàng tại Việt Nam.

Các danh mục sản phẩm hợp lệ:
${PRODUCT_CATEGORIES.map((c) => `- ${c}`).join('\n')}

Nhiệm vụ: Phân tích yêu cầu của người dùng và trả về JSON theo đúng định dạng sau:

{
  "category": "<tên danh mục chính xác từ danh sách trên, hoặc chuỗi rỗng nếu không xác định được>",
  "keywords": ["<từ khóa 1>", "<từ khóa 2>"],
  "minPrice": <số nguyên VNĐ hoặc null>,
  "maxPrice": <số nguyên VNĐ hoặc null>
}

Lưu ý quan trọng:
- Giữ nguyên tiếng Việt có dấu trong keywords
- Chuyển đổi đơn vị: "triệu" = 1.000.000, "nghìn/ngàn" = 1.000
- Ví dụ: "dưới 20 triệu" → maxPrice: 20000000
- Ví dụ: "từ 5 đến 10 triệu" → minPrice: 5000000, maxPrice: 10000000
- keywords chỉ chứa đặc điểm sản phẩm (gaming, mỏng nhẹ, pin trâu...), không lặp lại tên danh mục

Ví dụ 1:
Yêu cầu: "Tôi cần laptop gaming dưới 20 triệu"
Output: {"category":"Laptop","keywords":["gaming"],"minPrice":null,"maxPrice":20000000}

Ví dụ 2:
Yêu cầu: "tai nghe chống ồn tốt khoảng 2 triệu"
Output: {"category":"Tai nghe","keywords":["chống ồn"],"minPrice":null,"maxPrice":2000000}

Ví dụ 3:
Yêu cầu: "điện thoại chụp ảnh đẹp pin trâu từ 8 đến 15 triệu"
Output: {"category":"Điện thoại","keywords":["chụp ảnh đẹp","pin trâu"],"minPrice":8000000,"maxPrice":15000000}

Yêu cầu của người dùng:
"${userPrompt.trim()}"

Chỉ trả về JSON hợp lệ, không giải thích thêm.
`.trim();

    return withRetry(async () => {
        const raw = await callGemini(prompt);
        const result = safeParseJSON(raw, FALLBACK);

        // Validate: đảm bảo category phải nằm trong danh sách hợp lệ
        if (result.category && !PRODUCT_CATEGORIES.includes(result.category)) {
            console.warn('[aiSearch] Category không hợp lệ:', result.category);
            result.category = '';
        }
        if (result.category && CATEGORY_MAP[result.category]) {
            result.category = CATEGORY_MAP[result.category];
        }

        return result;
    });
}

/**
 * Xếp hạng và lọc danh sách sản phẩm theo mức độ phù hợp với yêu cầu người dùng.
 *
 * @param {string} userPrompt - Câu tìm kiếm gốc của người dùng
 * @param {Array<{id: string, name: string, price: number, description?: string, [key: string]: any}>} products
 * @param {{ maxResults?: number }} options
 * @returns {Promise<Array<{id: string, name: string, price: number, relevanceScore: number, reason: string}>>}
 */
export async function rankProducts(
    userPrompt,
    products,
    { maxResults = 10 } = {},
) {
    const FALLBACK = [];

    if (
        !userPrompt?.trim() ||
        !Array.isArray(products) ||
        products.length === 0
    ) {
        return FALLBACK;
    }

    // Chỉ gửi các trường cần thiết để giảm token và tránh lộ dữ liệu nhạy cảm
    const sanitizedProducts = products.map(
        ({ id, name, price, description, category, specs }) => ({
            id,
            name,
            price,
            ...(description && { description }),
            ...(category && { category }),
            ...(specs && { specs }),
        }),
    );

    const prompt = `
Bạn là chuyên gia tư vấn sản phẩm công nghệ tại Việt Nam.

Yêu cầu của khách hàng:
"${userPrompt.trim()}"

Danh sách sản phẩm cần xếp hạng:
${JSON.stringify(sanitizedProducts, null, 2)}

Nhiệm vụ:
1. Phân tích ngữ nghĩa tiếng Việt trong yêu cầu của khách hàng
2. Chọn các sản phẩm phù hợp nhất (tối đa ${maxResults} sản phẩm)
3. Sắp xếp theo mức độ liên quan giảm dần
4. Mỗi sản phẩm có điểm relevanceScore từ 1-10

Trả về JSON theo đúng định dạng sau (mảng):
[
  {
    "id": "<id sản phẩm>",
    "name": "<tên sản phẩm>",
    "price": <giá>,
    "relevanceScore": <số từ 1 đến 10>,
    "reason": "<giải thích ngắn gọn bằng tiếng Việt tại sao phù hợp>"
  }
]

Chỉ trả về JSON hợp lệ, không giải thích thêm.
`.trim();

    return withRetry(async () => {
        const raw = await callGemini(prompt);
        const result = safeParseJSON(raw, FALLBACK);

        if (!Array.isArray(result)) {
            console.error(
                '[aiSearch] rankProducts: Kết quả không phải mảng:',
                result,
            );
            return FALLBACK;
        }

        // Đảm bảo mỗi item có đủ trường bắt buộc
        return result.filter((item) => item?.id != null).slice(0, maxResults);
    });
}
