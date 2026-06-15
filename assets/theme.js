document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Sticky Header
  const header = document.querySelector('.site-header');
  if (header) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 50) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, {passive: true});
  }

  // 2. Scroll Progress Bar
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
          const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = (winScroll / height) * 100;
          progressBar.style.width = scrolled + "%";
          ticking = false;
        });
        ticking = true;
      }
    }, {passive: true});
  }

  // 3. Announcement Ticker
  const tickers = document.querySelectorAll('.announcement-bar');
  tickers.forEach(ticker => {
    const items = ticker.querySelectorAll('.announcement-bar__item');
    if (items.length > 1) {
      let currentIndex = 0;
      setInterval(() => {
        items[currentIndex].style.display = 'none';
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].style.display = 'block';
      }, 4000);
    }
  });

  // 4. Search Toggle
  const searchToggles = document.querySelectorAll('.js-search-toggle');
  const searchBar = document.querySelector('.search-bar');
  const searchInput = document.querySelector('.search-bar__input');
  
  searchToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchBar) {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active') && searchInput) {
          setTimeout(() => searchInput.focus(), 100);
        }
      }
    });
  });

  // 5. Cart Drawer & Ajax (Global Event Delegation)
  class CartAjax {
    static changeTimeout = null;

    static openCart() {
      const drawer = document.querySelector('.cart-drawer');
      const overlay = document.querySelector('.cart-drawer-overlay');
      if (drawer) drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    static closeCart() {
      const drawer = document.querySelector('.cart-drawer');
      const overlay = document.querySelector('.cart-drawer-overlay');
      if (drawer) drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    static async addItem(id, quantity = 1) {
      const drawer = document.querySelector('.cart-drawer');
      if(drawer) {
        drawer.style.pointerEvents = 'none';
        drawer.classList.add('cart-loading');
      }
      try {
        const response = await fetch(window.routes.cart_add_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            items: [{ id, quantity }],
            sections: 'main-cart,cart-drawer',
            sections_url: window.location.pathname
          })
        });
        const data = await response.json();
        if (data.status) {
          if (window.showToast) window.showToast(data.description || window.cartStrings?.error || 'Error', 'error');
        } else {
          if (data.sections) {
            if (data.sections['cart-drawer']) {
              const html = new DOMParser().parseFromString(data.sections['cart-drawer'], 'text/html');
              const newDrawer = html.querySelector('.cart-drawer');
              const currentDrawer = document.querySelector('.cart-drawer');
              if (newDrawer && currentDrawer) {
                currentDrawer.innerHTML = newDrawer.innerHTML;
              }
            }
            if (data.sections['main-cart']) {
              const html = new DOMParser().parseFromString(data.sections['main-cart'], 'text/html');
              const newMain = html.querySelector('.cart-page');
              const currentMain = document.querySelector('.cart-page');
              if (newMain && currentMain) {
                currentMain.innerHTML = newMain.innerHTML;
              }
            }
          }
          
          fetch(window.routes.cart_url + '.js')
            .then(res => res.json())
            .then(cart => {
              const countElements = document.querySelectorAll('.cart-count-badge');
              if (countElements.length) {
                countElements.forEach(el => el.textContent = cart.item_count);
              }
            });

          this.openCart();
        }
      } catch (error) {
        console.error('Error adding to cart', error);
        if (window.showToast) window.showToast('Error adding to cart', 'error');
      } finally {
        if(drawer) {
          drawer.style.pointerEvents = '';
          drawer.classList.remove('cart-loading');
        }
      }
    }

    static async changeItem(line, quantity) {
      const drawer = document.querySelector('.cart-drawer');
      const cartForm = document.querySelector('#cart-form');
      if(drawer) {
        drawer.style.pointerEvents = 'none';
        drawer.classList.add('cart-loading');
      }
      if(cartForm) {
        cartForm.style.pointerEvents = 'none';
        cartForm.classList.add('cart-loading');
      }
      
      try {
        const response = await fetch(window.routes.cart_change_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            line, 
            quantity,
            sections: 'main-cart,cart-drawer',
            sections_url: window.location.pathname
          })
        });
        const data = await response.json();
        
        if (data.sections) {
          if (data.sections['cart-drawer']) {
            const html = new DOMParser().parseFromString(data.sections['cart-drawer'], 'text/html');
            const newDrawer = html.querySelector('.cart-drawer');
            const currentDrawer = document.querySelector('.cart-drawer');
            if (newDrawer && currentDrawer) {
              currentDrawer.innerHTML = newDrawer.innerHTML;
            }
          }
          if (data.sections['main-cart']) {
            const html = new DOMParser().parseFromString(data.sections['main-cart'], 'text/html');
            const newMain = html.querySelector('.cart-page');
            const currentMain = document.querySelector('.cart-page');
            if (newMain && currentMain) {
              currentMain.innerHTML = newMain.innerHTML;
            }
          }
        }
        
        const countElements = document.querySelectorAll('.cart-count-badge');
        if (countElements.length && data.item_count !== undefined) {
          countElements.forEach(el => el.textContent = data.item_count);
        }
      } catch (error) {
        console.error('Error changing item', error);
        if (window.showToast) window.showToast('Error updating cart', 'error');
      } finally {
        if(drawer) {
          drawer.style.pointerEvents = '';
          drawer.classList.remove('cart-loading');
        }
        if(cartForm) {
          cartForm.style.pointerEvents = '';
          cartForm.classList.remove('cart-loading');
        }
      }
    }

    static formatMoney(cents) {
      return '$' + (cents / 100).toFixed(2);
    }

    static async refreshCart() {
      try {
        const [cartResponse, sectionsResponse] = await Promise.all([
          fetch(window.routes.cart_url + '.js'),
          fetch(`${window.routes.cart_url}?sections=main-cart,cart-drawer`)
        ]);
        
        const cart = await cartResponse.json();
        const sectionsData = await sectionsResponse.json();

        // Update Cart Drawer
        if (sectionsData['cart-drawer']) {
          const html = new DOMParser().parseFromString(sectionsData['cart-drawer'], 'text/html');
          const newDrawer = html.querySelector('.cart-drawer');
          const currentDrawer = document.querySelector('.cart-drawer');
          if (newDrawer && currentDrawer) {
            currentDrawer.innerHTML = newDrawer.innerHTML;
          }
        }

        // Update Main Cart Page
        if (sectionsData['main-cart']) {
          const html = new DOMParser().parseFromString(sectionsData['main-cart'], 'text/html');
          const newMain = html.querySelector('.cart-page');
          const currentMain = document.querySelector('.cart-page');
          if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML;
          }
        }
        
        const countElements = document.querySelectorAll('.cart-count-badge');
        if (countElements.length) {
          countElements.forEach(el => el.textContent = cart.item_count);
        }
      } catch (error) {
        console.error('Error refreshing cart', error);
      }
    }

    static initDelegation() {
      // Form Submits
      document.addEventListener('submit', (e) => {
        const form = e.target.closest('form[action="/cart/add"]');
        if (form) {
          e.preventDefault();
          const formData = new FormData(form);
          const id = formData.get('id');
          const quantity = formData.get('quantity') || 1;
          CartAjax.addItem(id, quantity);
        }
      });

      // Clicks
      document.addEventListener('click', (e) => {
        // Toggle Cart Open
        if (e.target.closest('.js-cart-toggle')) {
          e.preventDefault();
          CartAjax.openCart();
        }

        // Toggle Cart Close
        if (e.target.closest('.js-cart-close') || e.target.classList.contains('cart-drawer-overlay')) {
          e.preventDefault();
          CartAjax.closeCart();
        }

        // Quantity Buttons (+ / -)
        const qtyBtn = e.target.closest('.qty-btn');
        if (qtyBtn) {
          e.preventDefault();
          const input = qtyBtn.closest('.quantity-selector').querySelector('.qty-input');
          
          let qty = parseInt(input.value);
          if (qtyBtn.classList.contains('qty-plus')) qty++;
          if (qtyBtn.classList.contains('qty-minus')) qty--;
          
          const line = input.dataset.line;
          
          if (!line && qty < 1) {
             qty = 1; // Minimum 1 on product pages
          } else if (line && qty < 0) {
             qty = 0; // Minimum 0 in cart (removes item)
          }
          
          input.value = qty;
          
          if (!line) return; // Ignore AJAX update if no line dataset (e.g. product page)
          
          clearTimeout(CartAjax.changeTimeout);
          CartAjax.changeTimeout = setTimeout(() => {
            CartAjax.changeItem(line, qty);
          }, 300);
        }

        // Remove Item
        const removeBtn = e.target.closest('.item-remove');
        if (removeBtn) {
          e.preventDefault();
          const line = removeBtn.dataset.line;
          if (line) {
            CartAjax.changeItem(line, 0);
          }
        }
      });
    }
  }

  CartAjax.initDelegation();

  // 7. Infinite Carousel
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach(carousel => {
    const inner = carousel.querySelector('.carousel-inner');
    if(!inner) return;
    
    // Clear any existing clones if this runs multiple times
    inner.querySelectorAll('.carousel-clone').forEach(el => el.remove());

    const originalSlides = Array.from(inner.children);
    const originalCount = originalSlides.length;
    if(originalCount === 0) return;
    
    const slidesDesktop = parseInt(carousel.dataset.slides || 4);
    
    // 9. If product count <= visible slides, duplicate original set to fill at least 2 tracks
    let baseSlides = [...originalSlides];
    let currentCount = originalCount;
    let clonePasses = 0;
    while(currentCount <= slidesDesktop * 2 && clonePasses < 3) {
      originalSlides.forEach(slide => {
         let clone = slide.cloneNode(true);
         // Don't add clone class yet, these are part of the core infinite loop
         inner.appendChild(clone);
         baseSlides.push(clone);
      });
      currentCount = baseSlides.length;
      clonePasses++;
    }
    
    const baseCount = baseSlides.length;
    
    // 1. Clone slidesDesktop items to the BEGINNING and END
    const clonesBefore = [];
    for(let i = baseCount - slidesDesktop; i < baseCount; i++) {
       let clone = baseSlides[i].cloneNode(true);
       clone.classList.add('carousel-clone');
       clone.setAttribute('aria-hidden', 'true');
       inner.insertBefore(clone, inner.firstChild);
       clonesBefore.push(clone);
    }
    
    for(let i = 0; i < slidesDesktop; i++) {
       let clone = baseSlides[i].cloneNode(true);
       clone.classList.add('carousel-clone');
       clone.setAttribute('aria-hidden', 'true');
       inner.appendChild(clone);
    }
    
    const allSlides = Array.from(inner.children);
    const prevBtn = carousel.querySelector('.carousel-arrow-prev');
    const nextBtn = carousel.querySelector('.carousel-arrow-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    
    const speed = parseInt(carousel.dataset.speed || 3000);
    let currentIndex = slidesDesktop; 
    let isTransitioning = false;
    let autoplayTimer;
    
    // Create dots reflecting original slides
    if(dotsContainer) {
      dotsContainer.innerHTML = '';
      originalSlides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = i === 0 ? 'carousel-dot active' : 'carousel-dot';
        dot.addEventListener('click', () => {
           if(isTransitioning) return;
           // Jump to the closest occurrence of this dot
           const targetIndex = slidesDesktop + i;
           isTransitioning = true;
           goToSlide(targetIndex);
        });
        dotsContainer.appendChild(dot);
      });
    }
    const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

    function updateTransform(useTransition = true) {
      if(allSlides.length === 0) return;
      const slideWidth = allSlides[0].offsetWidth;
      inner.style.transition = useTransition ? 'transform 0.5s ease' : 'none';
      inner.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      
      if(dotsContainer && originalCount > 0) {
        const baseIndex = currentIndex - slidesDesktop;
        let activeDotIndex = baseIndex % originalCount;
        if (activeDotIndex < 0) activeDotIndex += originalCount;
        
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === activeDotIndex);
        });
      }
    }

    function goToSlide(index) {
      currentIndex = index;
      updateTransform(true);
      resetAutoplay();
    }

    inner.addEventListener('transitionend', () => {
      isTransitioning = false;
      
      // Jump backwards if we scrolled into the beginning clones
      if (currentIndex < slidesDesktop) {
        inner.style.transition = 'none';
        currentIndex = currentIndex + baseCount;
        updateTransform(false);
      } 
      // Jump forwards if we scrolled into the ending clones
      else if (currentIndex >= slidesDesktop + baseCount) {
        inner.style.transition = 'none';
        currentIndex = currentIndex - baseCount;
        updateTransform(false);
      }
    });

    if(prevBtn) prevBtn.addEventListener('click', () => {
       if(!isTransitioning) {
         isTransitioning = true;
         goToSlide(currentIndex - 1);
       }
    });
    
    if(nextBtn) nextBtn.addEventListener('click', () => {
       if(!isTransitioning) {
         isTransitioning = true;
         goToSlide(currentIndex + 1);
       }
    });
    
    function resetAutoplay() {
      clearInterval(autoplayTimer);
      if(speed > 0) {
        autoplayTimer = setInterval(() => {
           if(!document.hidden && !isTransitioning) {
             isTransitioning = true;
             goToSlide(currentIndex + 1);
           }
        }, speed);
      }
    }
    
    resetAutoplay();
    updateTransform(false); // Initial position
    
    // Intersection Observer for pausing carousel when offscreen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            clearInterval(autoplayTimer);
          } else {
            resetAutoplay();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(carousel);
    }

    // Prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(prefersReducedMotion.matches) {
       clearInterval(autoplayTimer);
       speed = 0;
    }

    // Touch Events
    let startX = 0;
    let currentX = 0;
    
    inner.addEventListener('touchstart', e => {
      if(isTransitioning) return;
      startX = e.touches[0].clientX;
      clearInterval(autoplayTimer);
    }, {passive: true});
    
    inner.addEventListener('touchmove', e => {
      if(isTransitioning) return;
      currentX = e.touches[0].clientX;
    }, {passive: true});
    
    inner.addEventListener('touchend', e => {
      if(isTransitioning || !startX || !currentX) {
        resetAutoplay();
        return;
      }
      const diff = startX - currentX;
      if(diff > 50) {
        isTransitioning = true;
        goToSlide(currentIndex + 1);
      } else if(diff < -50) {
        isTransitioning = true;
        goToSlide(currentIndex - 1);
      }
      startX = 0;
      currentX = 0;
      resetAutoplay();
    });
    
    window.addEventListener('resize', () => {
      updateTransform(false);
    });
  });

  // 8. Mobile Menu
  const menuToggles = document.querySelectorAll('.js-mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu-drawer');
  
  if (menuToggles.length > 0 && mobileMenu) {
    menuToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
      });
    });
  }

  // 9. Before After Slider
  const baSliders = document.querySelectorAll('.before-after-wrapper');
  if (baSliders.length > 0) {
    baSliders.forEach(slider => {
      const handle = slider.querySelector('.before-after-handle');
      const overlay = slider.querySelector('.before-after-overlay');
      let isDown = false;
      
      slider.addEventListener('mousedown', (e) => { isDown = true; }, {passive: true});
      slider.addEventListener('mouseup', () => { isDown = false; }, {passive: true});
      slider.addEventListener('mouseleave', () => { isDown = false; }, {passive: true});
      
      slider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        const rect = slider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(x / rect.width * 100, 100));
        handle.style.left = `${percent}%`;
        overlay.style.width = `${percent}%`;
      }, {passive: true});
      
      // Touch support
      slider.addEventListener('touchstart', () => { isDown = true; }, {passive: true});
      slider.addEventListener('touchend', () => { isDown = false; }, {passive: true});
      slider.addEventListener('touchmove', (e) => {
        if(!isDown) return;
        const rect = slider.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const percent = Math.max(0, Math.min(x / rect.width * 100, 100));
        handle.style.left = `${percent}%`;
        overlay.style.width = `${percent}%`;
      }, {passive: true});
    });
  }

  // 10. Accordion
  const accordions = document.querySelectorAll('.accordion-title');
  accordions.forEach(acc => {
    acc.addEventListener('click', function() {
      const item = this.parentElement;
      const content = item.querySelector('.accordion-content');
      
      item.classList.toggle('active');
      if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = null;
      }
    });
  });

  // 11. Variant Picker - Replaced by custom element <variant-selects>

  // 12. Quantity Selector - Replaced by global CartAjax delegation

  // 13. Product Image Gallery
  const thumbnails = document.querySelectorAll('.product-thumbnail');
  const mainImage = document.querySelector('.product-main-image img');
  
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', function(e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      if(mainImage && href) {
        mainImage.src = href;
        mainImage.srcset = this.dataset.srcset || href;
        
        thumbnails.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });




  // 16. Back To Top
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 400) {
            backToTop.classList.add('visible');
          } else {
            backToTop.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, {passive: true});
    
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 17. Toast Notification
  window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // 18. Lazy Load Images
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          if(image.dataset.src) image.src = image.dataset.src;
          if(image.dataset.srcset) image.srcset = image.dataset.srcset;
          image.classList.add('loaded');
          observer.unobserve(image);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  }


  // 20. Form Validation
  const contactForms = document.querySelectorAll('.contact-form');
  contactForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const email = form.querySelector('input[type="email"]');
      if(email && !email.value.includes('@')) {
        e.preventDefault();
        showToast('Please enter a valid email', 'error');
      }
    });
  });

});

class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.predictiveSearchResults = this.querySelector('#predictive-search');

    this.input.addEventListener('input', this.debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));
  }

  onChange() {
    const searchTerm = this.input.value.trim();

    if (!searchTerm.length) {
      this.close();
      return;
    }

    this.getSearchResults(searchTerm);
  }

  getSearchResults(searchTerm) {
    fetch(`${window.routes.predictive_search_url}?q=${searchTerm}&resources[type]=product&resources[limit]=4&section_id=predictive-search`)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
        this.predictiveSearchResults.innerHTML = resultsMarkup;
        this.open();
      })
      .catch((error) => {
        this.close();
        throw error;
      });
  }

  open() {
    this.predictiveSearchResults.style.display = 'block';
  }

  close() {
    this.predictiveSearchResults.style.display = 'none';
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}

customElements.define('predictive-search', PredictiveSearch);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('fieldset')).map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant || !this.currentVariant.featured_media) return;
    const mediaId = this.currentVariant.featured_media.id;
    const thumbnail = document.querySelector(`.product-thumbnail[data-media-id="${mediaId}"]`);
    if (thumbnail) thumbnail.click();
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-main`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const destination = document.querySelector('.product-price-wrapper');
        const source = html.querySelector('.product-price-wrapper');
        if (source && destination) destination.innerHTML = source.innerHTML;

        const price = document.querySelector('.product-price-wrapper .price');
        if (price) price.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant.available, 'out of stock');
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.querySelector(`#product-form-main`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = addButton.querySelector('span') || addButton;

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = 'Add to Cart';
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const addButton = document.querySelector(`#product-form-main [name="add"]`);
    if (!addButton) return;
    const addButtonText = addButton.querySelector('span') || addButton;
    const price = document.querySelector('.product-price-wrapper .price');
    if (price) price.classList.add('visibility-hidden');
    addButtonText.textContent = 'Unavailable';
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;
    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  updatePickupAvailability() {
    // Basic stub for updating pickup drawer if present
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);
