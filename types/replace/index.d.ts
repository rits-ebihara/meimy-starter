declare const replace: (options: IOptions) => void;
export interface IOptions {
    regex: string,
    replacement: string,
    paths: string[],
    recursive: boolean,
    silent: boolean,
}

export default replace;
