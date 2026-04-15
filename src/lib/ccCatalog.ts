/** EP-04 CC Library Browser — MVP placeholder catalog (public-domain style entries). */

export type CCBookEntry = { id: string; title: string; author: string };

export const CC_CATALOG_PLACEHOLDER: CCBookEntry[] = [
  { id: 'cc-1', title: 'Pride and Prejudice', author: 'Jane Austen' },
  { id: 'cc-2', title: 'Moby-Dick', author: 'Herman Melville' },
  { id: 'cc-3', title: 'Frankenstein', author: 'Mary Shelley' },
  { id: 'cc-4', title: 'The Scarlet Letter', author: 'Nathaniel Hawthorne' },
  { id: 'cc-5', title: 'A Room of One’s Own', author: 'Virginia Woolf' },
  { id: 'cc-6', title: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman' },
];
