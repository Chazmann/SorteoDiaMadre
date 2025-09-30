'use server';
/**
 * @fileOverview Generates an image with four random numbers for the 'Sorteo Día de la Madre' lottery,
 * incorporating the seller's name, buyer's name, and buyer's phone number into the image.
 *
 * - generateMotherSDayImage - A function that handles the image generation process.
 * - GenerateMotherSDayImageInput - The input type for the generateMotherSDayImage function.
 * - GenerateMotherSDayImageOutput - The return type for the generateMotherSDayImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotherSDayImageInputSchema = z.object({
  sellerName: z.string().describe("The name of the seller."),
  buyerName: z.string().describe("The name of the buyer."),
  buyerPhoneNumber: z.string().describe("The phone number of the buyer."),
  numbers: z.array(z.number()).length(4).describe("Four unique random numbers between 0 and 999."),
});
export type GenerateMotherSDayImageInput = z.infer<typeof GenerateMotherSDayImageInputSchema>;

const GenerateMotherSDayImageOutputSchema = z.object({
  image: z.string().describe("The generated image as a data URI."),
});
export type GenerateMotherSDayImageOutput = z.infer<typeof GenerateMotherSDayImageOutputSchema>;

export async function generateMotherSDayImage(input: GenerateMotherSDayImageInput): Promise<GenerateMotherSDayImageOutput> {
  return generateMotherSDayImageFlow(input);
}

const motherSdayImagePrompt = ai.definePrompt({
  name: 'generateMotherSDayImagePrompt',
  input: {schema: GenerateMotherSDayImageInputSchema},
  prompt: `Generate an image for the 'Sorteo Día de la Madre' lottery.

The image should include the following information:
- Four unique random numbers: {{numbers}}
- Seller's Name: {{sellerName}}
- Buyer's Name: {{buyerName}}
- Buyer's Phone Number: {{buyerPhoneNumber}}
- Drawing Date: October 28, 2025

The content of the image should be appropriate for the context of a Mother's Day lottery. It should be visually appealing and festive.

Please return the generated image as a data URI.
`,
});

const generateMotherSDayImageFlow = ai.defineFlow(
  {
    name: 'generateMotherSDayImageFlow',
    inputSchema: GenerateMotherSDayImageInputSchema,
    outputSchema: GenerateMotherSDayImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: (await motherSdayImagePrompt(input)).text,
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate image.');
    }

    return {
      image: media.url,
    };
  }
);
