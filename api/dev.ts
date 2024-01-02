import backend from "./src/backend";

const PORT = 3001;

backend.listen(PORT, () =>
  console.log(`API available at http://localhost:${PORT}`)
);
