import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface WishlistHook {
  wishlist: string[];
  addToWishlist: (productId: string, productName?: string) => void;
  removeFromWishlist: (productId: string, productName?: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, productName?: string) => void;
  clearWishlist: () => void;
}

export function useWishlist(): WishlistHook {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  }, [wishlist, isLoaded]);

  const addToWishlist = (productId: string, productName?: string) => {
    setWishlist((prev) => {
      if (!prev.includes(productId)) {
        toast.success(productName ? `${productName} ditambahkan ke wishlist` : 'Produk ditambahkan ke wishlist', {
          icon: '❤️',
        });
        return [...prev, productId];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId: string, productName?: string) => {
    setWishlist((prev) => {
      toast.info(productName ? `${productName} dihapus dari wishlist` : 'Produk dihapus dari wishlist', {
        icon: '💔',
      });
      return prev.filter((id) => id !== productId);
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const toggleWishlist = (productId: string, productName?: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId, productName);
    } else {
      addToWishlist(productId, productName);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    toast.success('Wishlist dikosongkan');
  };

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
  };
}
