module.exports = {
  language: "en",
  title: "Ariel Barmat",
  description: "Personal blog and thoughts on technology, AI, and more",
  base: "https://abarmat.com",
  buildCommitSha: process.env.SITE_COMMIT_SHA || "",
  images: {
    avatar: {
      alt: "AB",
      src: "/assets/images/avatar-90.jpg",
      srcset: "/assets/images/avatar-45.jpg 1x, /assets/images/avatar-90.jpg 2x, /assets/images/avatar-135.jpg 3x",
      sizes: "45px",
      width: 45,
      height: 45,
    },
    appleTouchIcon: "/assets/images/avatar.jpg",
    favicon: "/assets/images/favicon-32.png",
  },
  author: {
    name: "Ariel Barmat",
    email: "hey@abarmat.com",
  },
};
