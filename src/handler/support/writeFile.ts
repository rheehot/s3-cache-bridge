import { Readable } from "stream";
import { createWriteStream } from "fs";
import dirty from "../../local/dirty";
import ensureParentDirectory from "../../utils/ensureParentDirectory";
import keyAsLocalFile from "../../local/keyAsLocalFile";
import log from "../../utils/log";
import syncOneWithS3 from "../../local/syncOneWithS3";

export default async function writeFile({
  key,
  readable,
  append,
  sync,
}: {
  key: string;
  readable: Readable;
  append: boolean;
  sync: boolean;
}) {
  const localFile = keyAsLocalFile(key);
  log("Put a local file", key, localFile, { append, sync });

  dirty.add(key);
  await writeToLocalFile(readable, localFile, append);

  if (sync) {
    log("Sync immediately", key);
    await syncOneWithS3(key);
  }
}

function writeToLocalFile(
  readable: Readable,
  localFile: string,
  append: boolean
) {
  ensureParentDirectory(localFile);
  return new Promise<void>((resolve, reject) =>
    readable
      .on("error", reject)
      .pipe(
        createWriteStream(localFile, {
          flags: append ? "a" : "w",
        })
      )
      .on("error", reject)
      .on("finish", resolve)
  );
}
