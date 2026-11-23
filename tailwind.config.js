/** @type {import('tailwindcss').Config} */
const token = (n) => `var(--${n})`;
const hue = (n) => ({
  DEFAULT: token(n),
  tua: token(`${n}-tua`),
  muda: token(`${n}-muda`),
});

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kertas: token("kertas"),
        putih: token("putih"),
        tinta: token("tinta"),
        muted: token("muted"),
        garis: {
          DEFAULT: token("garis"),
          kuat: token("garis-kuat"),
        },
        nila: hue("nila"),
        kunyit: hue("kunyit"),
        teh: hue("teh"),
        bata: hue("bata"),
        telang: hue("telang"),
        langit: hue("langit"),
        mawar: hue("mawar"),
        tanah: hue("tanah"),
        pucuk: token("pucuk"),
        bahaya: {
          DEFAULT: token("bahaya"),
          muda: token("bahaya-muda"),
        },
        aksen: {
          DEFAULT: token("aksen"),
          teks: token("aksen-teks"),
          muda: token("aksen-muda"),
          tua: token("aksen-tua"),
        },
      },
      borderRadius: {
        kontrol: "var(--r-kontrol)",
        kartu: "var(--r-kartu)",
        "kartu-besar": "var(--r-kartu-besar)",
        pop: "var(--r-pop)",
        pil: "var(--r-pil)",
      },
      boxShadow: {
        float: "var(--e-float)",
        bar: "var(--e-bar)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
