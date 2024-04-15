/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.{html,js}"],
    theme: {
        extend: {
            colors: {
                ebony: {
                    50: "#ebf6ff",
                    100: "#daefff",
                    200: "#bde0ff",
                    300: "#95c9ff",
                    400: "#6ba7ff",
                    500: "#4984ff",
                    600: "#295eff",
                    700: "#1d4be5",
                    800: "#1b42b8",
                    900: "#1f3d90",
                    950: "#080f25",
                },
                midnight: {
                    50: "#edf7ff",
                    100: "#dfefff",
                    200: "#c4e1ff",
                    300: "#a1ccff",
                    400: "#7bacfe",
                    500: "#5c8cf8",
                    600: "#3f67ec",
                    700: "#3153d1",
                    800: "#2b48a8",
                    900: "#2a4185",
                    950: "#111935",
                },
            },
        },
    },
    plugins: [],
};
