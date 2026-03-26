import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const tsContent = `export interface TrackItem {
  id: number;
  text: string;
  isCompleted: boolean;
  image: string | null;
}

export const my100List: TrackItem[] = ${JSON.stringify(items, null, 2)};
`;

    const filePath = path.join(process.cwd(), 'src', 'data', 'my100list.ts');
    fs.writeFileSync(filePath, tsContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
