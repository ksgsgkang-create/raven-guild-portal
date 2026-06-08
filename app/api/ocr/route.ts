import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: '구글 API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const googleResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    const data = await googleResponse.json();
    
    if (data.error || (data.responses?.[0]?.error)) {
      const googleError = data.error || data.responses[0].error;
      console.error('구글 비전 API 반환 에러:', googleError);
      return NextResponse.json({ error: googleError.message }, { status: 400 });
    }

    const textAnnotations = data.responses?.[0]?.textAnnotations;
    const fullText = textAnnotations && textAnnotations.length > 0 ? textAnnotations[0].description : '';

    return NextResponse.json({ text: fullText });
  } catch (error: any) {
    console.error('서버 내부 에러:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}