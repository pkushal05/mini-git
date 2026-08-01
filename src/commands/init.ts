import { Repository } from "../core/Repository";

export function init() {
    let newRepo = new Repository(process.cwd());
    newRepo.init();

    // const hash = newRepo.storeObject("Hello, I'm Kushal Patel");
    // console.log(hash);
}
