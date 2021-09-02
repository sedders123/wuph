const { Command, flags } = require("@oclif/command");
const { readdir, readFile } = require("fs").promises;
const yaml = require("js-yaml");
const { parseTweet } = require("twitter-text");
const probe = require("probe-image-size");

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

const gcd = (a, b) => {
  if (b > a) {
    temp = a;
    a = b;
    b = temp;
  }
  while (b != 0) {
    m = a % b;
    a = b;
    b = m;
  }
  return a;
};

const ratio = (x, y) => {
  c = gcd(x, y);
  return `${x / c},${y / c}`;
};

const VALID_INSTAGRAM_IMAGE_RATIOS = ["1,1", "4:5", "1.91:1"];

const Providers = {
  Twitter: "twitter",
  Facebook: "facebook",
  Instagram: "instagram",
};

const Validators = {
  [Providers.Twitter]: async (file) => {
    const validationResult = parseTweet(file[`${Providers.Twitter}_text`]);
    return { success: validationResult.valid, errors: [] };
  },
  [Providers.Facebook]: async () => ({ success: true, errors: [] }),
  [Providers.Instagram]: async (file) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = file[`${Providers.Instagram}_text`].match(urlRegex);

    if (!file[`${Providers.Instagram}_media`]) return !urls;

    let mediaValid = true;
    for (let image of file[`${Providers.Instagram}_media`]) {
      const media = await probe(image);
      const media_ratio = ratio(media.height, media.width);
      mediaValid =
        mediaValid && VALID_INSTAGRAM_IMAGE_RATIOS.includes(media_ratio);
    }

    return { success: mediaValid && !urls, errors: [] };
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
    recurisve: flags.boolean({ char: "r" }),
  };

  static args = [{ name: "dir" }];

  async getFiles(dir, recurisve = false) {
    const files = [];
    const items = await readdir(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && recurisve) {
        files.push(...(await this.getFiles(`${dir}${item.name}/`)));
      } else if (item.name.endsWith(".yaml")) {
        files.push(`${dir}${item.name}`);
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

    const files = await this.getFiles(args.dir, flags.recurisve);
    for (const file of files) {
      const result = await this.validate(file);
      if (!result.success) {
        this.log(`${file} is invalid`);
        this.exit(1);
      }
    }
  }
}

module.exports = ValidateCommand;
