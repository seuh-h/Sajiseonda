import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.tagline}>나를 알아가는 가장 재미있는 방법</p>
        <div className={styles.links}>
          <a href="/privacy" className={styles.link}>개인정보처리방침</a>
          <span className={styles.dot}>·</span>
          <a href="mailto:stu4704@gmail.com" className={styles.link}>stu4704@gmail.com</a>
          <span className={styles.dot}>·</span>
          <a href="mailto:yyouks1070@gmail.com" className={styles.link}>yyouks1070@gmail.com</a>
        </div>
        <p className={styles.copy}>© 2026 사지선다. All rights reserved.</p>
      </div>
    </footer>
  )
}
