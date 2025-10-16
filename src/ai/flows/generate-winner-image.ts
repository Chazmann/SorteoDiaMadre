
'use server';
/**
 * @fileOverview Generates an SVG image for a prize winner, including prize details and winner information.
 *
 * - generateWinnerImage - A function that handles the winner image generation process.
 * - GenerateWinnerImageInput - The input type for the generateWinnerImage function.
 * - GenerateWinnerImageOutput - The return type for the generateWinnerImage function.
 */

import {z} from 'zod';

const GenerateWinnerImageInputSchema = z.object({
  prizeOrder: z.number().describe("The order of the prize (e.g., 1 for 1st prize)."),
  prizeTitle: z.string().describe("The title of the prize won."),
  winningNumber: z.number().describe("The winning number."),
  buyerName: z.string().describe("The name of the winner."),
  ticketId: z.string().describe("The ID of the winning ticket."),
  ticketNumbers: z.array(z.number()).describe("The numbers on the winning ticket."),
});
export type GenerateWinnerImageInput = z.infer<typeof GenerateWinnerImageInputSchema>;

const GenerateWinnerImageOutputSchema = z.object({
  image: z.string().describe("The generated SVG image as a data URI."),
});
export type GenerateWinnerImageOutput = z.infer<typeof GenerateWinnerImageOutputSchema>;


const generateSvgTemplate = (input: GenerateWinnerImageInput): string => {
  // Function to escape special XML/HTML characters
  const escape = (str: string | number) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const prizeOrder = escape(input.prizeOrder);
  const buyerName = escape(input.buyerName);
  const prizeTitle = escape(input.prizeTitle);
  const winningNumber = escape(String(input.winningNumber).padStart(3, '0'));
  const ticketId = escape(String(input.ticketId).padStart(3, '0'));
  
  const ticketNumbersHtml = input.ticketNumbers
    .map(num => `<span class="ticket-number ${num === input.winningNumber ? 'is-winner' : ''}">${escape(String(num).padStart(3, '0'))}</span>`)
    .join(' ');


  return `
    <svg width="500" height="350" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Belleza&amp;family=Playfair+Display:wght@700&amp;family=Teko:wght@600&amp;display=swap');
          .container {
            font-family: 'Belleza', sans-serif;
            color: #333;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
          }
          .header {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #D4AF37; /* Gold */
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          .winner-name {
            font-family: 'Belleza', sans-serif;
            font-size: 24px;
            margin: 4px 0;
            font-weight: bold;
          }
          .prize-details {
            margin-top: 10px;
            font-size: 18px;
          }
          .prize-title {
            font-weight: bold;
            color: #E91E63;
          }
          .ticket-info {
            margin-top: 10px;
            font-size: 13px;
            color: #555;
          }
          .ticket-numbers-container {
            display: flex;
            gap: 8px;
            margin-top: 4px;
          }
          .ticket-number {
            font-mono: true;
            font-family: 'Teko', sans-serif;
            font-size: 20px;
            background-color: rgba(0,0,0,0.05);
            padding: 2px 6px;
            border-radius: 4px;
          }
          .ticket-number.is-winner {
            background-color: #D4AF37;
            color: white;
            font-weight: bold;
          }
          .winning-number-box {
            margin-top: 15px;
          }
          .winning-number-label {
            font-size: 14px;
            color: #666;
          }
          .winning-number {
            font-family: 'Teko', sans-serif;
            font-size: 60px;
            line-height: 1;
            font-weight: 600;
            color: white;
            background-color: #E91E63;
            padding: 5px 20px;
            border-radius: 10px;
            display: inline-block;
            margin-top: 5px;
            border: 2px solid #F8BBD0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }
        </style>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFF8E1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFECB3;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <foreignObject width="500" height="350">
        <div xmlns="http://www.w3.org/1999/xhtml" class="container">
          <div class="header">¡Felicidades!</div>
          <div class="winner-name">${buyerName}</div>
          <div class="prize-details">
            Has ganado el <strong>${prizeOrder}° Premio</strong>:
            <div class="prize-title">${prizeTitle}</div>
          </div>
          <div class="ticket-info">
            <div>Ticket #${ticketId} - Tus números:</div>
            <div class="ticket-numbers-container">
              ${ticketNumbersHtml}
            </div>
          </div>
          <div class="winning-number-box">
            <div class="winning-number-label">con el número ganador</div>
            <div class="winning-number">${winningNumber}</div>
          </div>
        </div>
      </foreignObject>
    </svg>
  `;
};

/**
 * Generates an SVG image for a prize winner using a template.
 * @param input - The winner's data.
 * @returns An object containing the generated image as a data URI.
 */
export async function generateWinnerImage(input: GenerateWinnerImageInput): Promise<GenerateWinnerImageOutput> {
  const svgCode = generateSvgTemplate(input);
  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgCode).toString('base64')}`;
  
  return {
    image: svgDataUri,
  };
}
