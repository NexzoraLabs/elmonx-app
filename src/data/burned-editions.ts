// Burned (permanently destroyed) editions per drop id — same hardcoded list as the website
// (lmnx-st_ng drop-accordion.ts BURNED_EDITIONS). Keep both in sync when a burn is added.
export type BurnedEdition = { tokenId: string; name: string };

export const BURNED_EDITIONS: Record<string, BurnedEdition[]> = {
  '6ac827b8a3c6d7372e433132': [
    { tokenId: '34', name: 'Portrait of Marten Soolmans, 1634 #34' },
    { tokenId: '9',  name: 'Portrait of Marten Soolmans, 1634 #9' },
    { tokenId: '8',  name: 'Portrait of Marten Soolmans, 1634 #8' },
    { tokenId: '39', name: 'Portrait of Marten Soolmans, 1634 #39' },
    { tokenId: '43', name: 'Portrait of Marten Soolmans, 1634 #43' },
    { tokenId: '58', name: 'Portrait of Marten Soolmans, 1634 #58' },
    { tokenId: '54', name: 'Portrait of Marten Soolmans, 1634 #54' },
    { tokenId: '22', name: 'Portrait of Marten Soolmans, 1634 #22' },
    { tokenId: '45', name: 'Portrait of Marten Soolmans, 1634 #45' },
    { tokenId: '30', name: 'Portrait of Marten Soolmans, 1634 #30' },
    { tokenId: '60', name: 'Portrait of Marten Soolmans, 1634 #60' },
    { tokenId: '18', name: 'Portrait of Marten Soolmans, 1634 #18' },
    { tokenId: '19', name: 'Portrait of Marten Soolmans, 1634 #19' },
    { tokenId: '36', name: 'Portrait of Marten Soolmans, 1634 #36' },
    { tokenId: '41', name: 'Portrait of Marten Soolmans, 1634 #41' },
    { tokenId: '25', name: 'Portrait of Marten Soolmans, 1634 #25' },
    { tokenId: '50', name: 'Portrait of Marten Soolmans, 1634 #50' },
    { tokenId: '6',  name: 'Portrait of Marten Soolmans, 1634 #6' },
    { tokenId: '28', name: 'Portrait of Marten Soolmans, 1634 #28' },
    { tokenId: '40', name: 'Portrait of Marten Soolmans, 1634 #40' },
    { tokenId: '10', name: 'Portrait of Marten Soolmans, 1634 #10' },
  ],
};
