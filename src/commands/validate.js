const { Command, flags } = require("@oclif/command");
const { readdir, readFile } = require("fs").promises;
const yaml = require("js-yaml");
const { parseTweet } = require("twitter-text");
const probe = require("probe-image-size");

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

const Providers = {
  Twitter: "twitter",
  Facebook: "facebook",
  Instagram: "instagram",
  LinkedIn: "linkedin",
};

const INSTAGRAM_MIN_WIDTH = 400;
const INSTAGRAM_MIN_HEIGHT = 500;

const Validators = {
  [Providers.Twitter]: async (file) => {
    const validationResult = parseTweet(file[`${Providers.Twitter}_text`]);
    return {
      success: validationResult.valid,
      errors: ["Text is too long for Twitter"],
    };
  },
  [Providers.Facebook]: async () => ({ success: true, errors: [] }),
  [Providers.LinkedIn]: async () => ({ success: true, errors: [] }),
  [Providers.Instagram]: async (file) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = file[`${Providers.Instagram}_text`].match(urlRegex);

    if (!file[`${Providers.Instagram}_media`]) return !urls;

    let mediaValid = true;
    let mediaRatio = null;
    for (let image of file[`${Providers.Instagram}_media`]) {
      const media = await probe(image);
      mediaValid =
        media.height > INSTAGRAM_MIN_HEIGHT &&
        media.width > INSTAGRAM_MIN_WIDTH;
    }

    return {
      success: mediaValid && !urls,
      errors: [
        mediaValid
          ? null
          : `Image is too small for Instagram. Instagram has a minimum size of 400px x 500px`,
        !urls ? null : "Instagram text contains a URL",
      ],
    };
  },
};

class WuphPost {
  constructor(text, media, providers, rawData) {
    this.text = text;
    this.media = media ? media.split(",") : null;
    this.providers = providers.split(",");
    for (let provider in Providers) {
      this[`${Providers[provider]}_text`] =
        rawData[`${Providers[provider]}_text`] != null
          ? rawData[`${Providers[provider]}_text`]
          : this.text;

      this[`${Providers[provider]}_media`] =
        rawData[`${Providers[provider]}_media`] != null
          ? rawData[`${Providers[provider]}_media`].split(",")
          : this.media;
    }
  }
}

class ValidateCommand extends Command {
  static description = "validate wuph posts in the given directory";

  static examples = [`$ wuph validate posts/`];

  static flags = {
    help: flags.help({ char: "h" }),
    recursive: flags.boolean({ char: "r" }),
  };

  static args = [{ name: "dir" }];

  async getFiles(dir, recursive = false, level = 0) {
    const files = [];

    const items = await readdir(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith(".")) continue;
      if (item.isDirectory() && recursive) {
        files.push(
          ...(await this.getFiles(
            `${level > 0 ? dir : ""}${item.name}/`,
            true,
            level + 1
          ))
        );
      } else if (item.name.endsWith(".yaml")) {
        files.push(`${level > 0 ? dir : ""}${item.name}`);
      }
    }
    return files;
  }

  async parseWuphPost(file) {
    const data = yaml.load(await readFile(file, "utf8"));
    const wuphPost = new WuphPost(data.text, data.media, data.providers, {
      ...data,
    });
    return wuphPost;
  }

  async validate(file) {
    try {
      const post = await this.parseWuphPost(file);

      let valid = true;
      let errors = [];
      for (let provider of post.providers) {
        var providerResult = await Validators[
          Providers[getKeyByValue(Providers, provider)]
        ](post);
        this.debug(`${provider} is ${providerResult}`);
        valid = valid && providerResult.success;
        errors = errors.concat(providerResult.errors);
      }

      return { success: valid, errors };
    } catch (e) {
      this.log(e);
      return false;
    }
  }

  async run() {
    const { args, flags } = this.parse(ValidateCommand);

    const files = await this.getFiles(args.dir, flags.recursive);
    for (const file of files) {
      const result = await this.validate(file);
      if (!result.success) {
        this.log(`${file} is invalid`);
        for (let error of result.errors) {
          if (error) this.log(` - ${error}`);
        }
        this.exit(1);
      }
    }
  }
}

module.exports = ValidateCommand;
