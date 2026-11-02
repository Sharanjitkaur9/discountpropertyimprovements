/* =====================================================================
   SITE SETTINGS — the only file you normally need to edit.
   ===================================================================== */
window.DPI_CONFIG = {

  /* -------------------------------------------------------------------
     1) FORM DELIVERY  (quote form, quote pop-up, review form)
     Until `endpoint` is filled in, NOTHING is sent online. Visitors are
     told this honestly and offered a pre-filled WhatsApp message instead.

     Option A — Web3Forms (free tier, emails you each enquiry):
       1. Get an access key at https://web3forms.com (enter your email).
       2. endpoint:  'https://api.web3forms.com/submit'
          accessKey: 'your-access-key'
     Option B — Formspree:
       1. Create a form at https://formspree.io
       2. endpoint:  'https://formspree.io/f/yourFormId'
          accessKey: ''   (leave empty)
     Option C — your own server: any URL that accepts a POST of
       multipart/form-data and returns HTTP 2xx (JSON optional).
     ------------------------------------------------------------------- */
  
forms: {
  endpoint: 'https://api.web3forms.com/submit',
  accessKey: '6769d44b-9fe6-4aa3-a80f-9bf6a101c0eb',
  uploadFiles: false,
  maxFileMB: 15,
  email: ''
},

  whatsapp: '64220910008',     // international format, no "+" or spaces
  phoneDisplay: '022 091 0008',
  phoneHref: 'tel:+64220910008',

  /* -------------------------------------------------------------------
     2) "SEE THE TRANSFORMATION" PROJECTS
     The two entries below are DEMONSTRATION ILLUSTRATIONS, not photos of
     completed work — the site labels them that way while verified:false.

     To add a real project: put the photos in assets/img/projects/, then add
     an entry with verified:true and the real before/after file paths.
     Only do this with genuine photos of your own completed work.
     ------------------------------------------------------------------- */
  // Demonstration illustrations stay hidden unless this is true.
  // The section appears automatically once a project with verified:true is added.
  showDemoTransformations: false,

  transformations: [
    {
      id: 'media-wall',
      tab: 'Media feature wall',
      verified: false,
      service: 'Acoustic Slats & Media Feature Walls',
      before: 'assets/img/demo/media-wall-before.svg',
      after: 'assets/img/demo/media-wall-after.svg',
      beforeAlt: 'Illustration: plain plasterboard living-room wall with exposed TV cables and a low cabinet',
      afterAlt: 'Illustration: the same wall finished with walnut acoustic slats, flush TV, warm LED wash and floating console',
      title: 'Plain wall to acoustic slat media wall',
      summary: 'How a typical living-room wall changes when cabling is concealed in the frame and the wall is finished in timber acoustic slats with warm lighting.',
      details: [
        ['Scope', 'In-wall conduit for power & HDMI, slat panelling, LED channel, floating console'],
        ['Materials', 'Timber-veneer acoustic slats over acoustic felt, 3000K warm LED strip'],
        ['Finish', 'Flush TV bracket, concealed outlets, mitred end panels']
      ]
    },
    {
      id: 'flooring',
      tab: 'Timber flooring',
      verified: false,
      service: 'Engineered Timber & Laminate Flooring',
      before: 'assets/img/demo/flooring-before.svg',
      after: 'assets/img/demo/flooring-after.svg',
      beforeAlt: 'Illustration: room with worn, stained carpet and tired skirting boards',
      afterAlt: 'Illustration: the same room with engineered oak plank flooring and new skirting',
      title: 'Worn carpet to engineered oak flooring',
      summary: 'A typical flooring upgrade: old carpet lifted, subfloor levelled, acoustic underlay laid and engineered timber planks installed with new trims.',
      details: [
        ['Scope', 'Carpet removal, subfloor levelling, underlay, plank installation, trims'],
        ['Materials', 'Engineered oak planks, acoustic underlayment'],
        ['Finish', 'Undercut door jambs, new skirting and threshold trims']
      ]
    }
    /* Example of a real project entry:
    ,{
      id: 'merivale-media-wall',
      tab: 'Merivale media wall',
      verified: true,
      service: 'Acoustic Slats & Media Feature Walls',
      before: 'assets/img/projects/merivale-before.jpg',
      after: 'assets/img/projects/merivale-after.jpg',
      beforeAlt: '...', afterAlt: '...',
      title: '...', summary: '...',
      details: [['Location', 'Merivale, Christchurch'], ['Completed', 'March 2026']]
    } */
  ]
};
