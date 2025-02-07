import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <a href="https://not.yet.red">
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={32}
            height={32}
          />
          Not Yet Red →
        </a>
      </main>
    </div>
  );
}
