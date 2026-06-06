export async function getAIRecommendation(userPrompt, products) {
    const API_KEY = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

    const geminiPrompt = `
         Here is a list of available products:
         ${JSON.stringify(products, null, 2)}

         Based on the following user request, filter and suggest the best matching products:
         "${userPrompt}"

         Only return the matching products in JSON format.`;

    const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
        }),
    });

    const data = await response.json();

    const aiResponseText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    const cleanedText = aiResponseText.replace(/```json|```/g, '').trim();

    if (!cleanedText) {
        throw new Error('AI response is empty or invalid.');
    }

    try {
        const parsedProducts = JSON.parse(cleanedText);
        return { success: true, products: parsedProducts };
    } catch {
        throw new Error('Failed to parse AI response as JSON.');
    }
}


// export async function extractSearchIntent(userPrompt) {
//     const API_KEY = process.env.GEMINI_API_KEY;

//     const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

//     const prompt = `
//     Bạn là AI hỗ trợ tìm kiếm sản phẩm công nghệ.

//     Hãy phân tích yêu cầu của người dùng và trả về JSON theo format:

//     {
//       "category": "",
//       "keywords": [],
//       "minPrice": null,
//       "maxPrice": null
//     }

//     Danh mục hợp lệ:

//     - Laptop
//     - Điện thoại
//     - Máy tính bảng
//     - Tai nghe
//     - Chuột
//     - Bàn phím
//     - Màn hình

//     Yêu cầu:

//     "${userPrompt}"

//     Chỉ trả về JSON hợp lệ.
//     `;

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

//     const text =
//         data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     const cleanedText = text
//         .replace(/```json/g, '')
//         .replace(/```/g, '')
//         .trim();

//     return JSON.parse(cleanedText);
// }

// export async function rankProducts(
//     userPrompt,
//     products,
// ) {
//     const API_KEY = process.env.GEMINI_API_KEY;

//     const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

//     const prompt = `
//     Bạn là chuyên gia tư vấn thiết bị công nghệ.

//     Người dùng yêu cầu:

//     "${userPrompt}"

//     Danh sách sản phẩm:

//     ${JSON.stringify(products)}

//     Hãy chọn tối đa 10 sản phẩm phù hợp nhất.

//     Chỉ trả về JSON.
//     `;

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

//     const text =
//         data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     const cleanedText = text
//         .replace(/```json/g, '')
//         .replace(/```/g, '')
//         .trim();

//     return JSON.parse(cleanedText);
// }

