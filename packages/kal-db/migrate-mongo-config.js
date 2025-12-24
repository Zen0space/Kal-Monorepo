import "dotenv/config";

// Support both individual env vars and a full DATABASE_URL
const getDatabaseUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const {
    MONGODB_HOST = "localhost",
    MONGODB_PORT = "27017",
    MONGODB_USER,
    MONGODB_PASSWORD,
    MONGODB_DATABASE,
  } = process.env;
  
  return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;
};

const getDbName = () => {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return url.pathname.slice(1).split("?")[0];
    } catch {
      return "kal";
    }
  }
  return process.env.MONGODB_DATABASE || "kal";
};

/** @type {import('migrate-mongo').config.Config} */
const config = {
  mongodb: {
    url: getDatabaseUri(),
    databaseName: getDbName(),
    options: {
      // connectTimeoutMS: 3600000, // increase connection timeout (optional)
    },
  },

  // The migrations directory, you can use a relative path
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored
  changelogCollectionName: "changelog",

  // The file extension for migration files
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents
  useFileHash: false,

  // module system to use, commonjs or esm
  moduleSystem: "esm",
};

export default config;
