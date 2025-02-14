// components/Skeleton.tsx
import React from 'react';
import styles from './BirdCard.module.css';

export const FamilySkeleton = () => (
    <div className={styles.familyCard}>
      <div className={`${styles.imageContainer} ${styles.skeleton}`} />
      <div className={styles.familyInfo}>
        <div className={`${styles.skeletonText} ${styles.skeleton}`} />
        <div className={`${styles.skeletonText} ${styles.skeleton}`} />
      </div>
    </div>
  );
  
export const SpeciesSkeleton = () => (
<div className={styles.speciesCard}>
    <div className={`${styles.imageContainer} ${styles.skeleton}`} />
    <div className={styles.speciesInfo}>
    <div className={`${styles.skeletonText} ${styles.skeleton}`} />
    <div className={`${styles.skeletonText} ${styles.skeleton}`} />
    </div>
</div>
);
