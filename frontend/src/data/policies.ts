import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/pricing';

// The store's policy pages (/policies/:slug), written to match how the site and the API work.
export type Policy = { slug: string; title: string; summary: string; sections: { heading: string; paragraphs: string[] }[] };

export const POLICIES_UPDATED = '29 October 2026';

export const policies: Policy[] = [
  {
    slug: 'shipping',
    title: 'Shipping and delivery',
    summary: 'Where we deliver, what delivery costs and when your order leaves our warehouse.',
    sections: [
      {
        heading: 'Where we deliver',
        paragraphs: ['We deliver across India to any address with a valid 6-digit pincode. Enter the full address and a 10-digit mobile number at checkout so the courier can reach you.'],
      },
      {
        heading: 'Delivery charges',
        paragraphs: [
          `Delivery is free on orders of ${formatPrice(FREE_DELIVERY_THRESHOLD)} or more. Below that, delivery costs ${formatPrice(DELIVERY_FEE)} per order.`,
          'Free delivery goes by the value of the items before any coupon, so applying a coupon never adds a delivery charge.',
        ],
      },
      {
        heading: 'When your order ships',
        paragraphs: [
          'Orders are packed and shipped within 1–2 business days. How long delivery takes after that depends on your pincode.',
          'You can follow every order under My orders, where each order shows whether it is being packed and shipped, delivered or cancelled.',
        ],
      },
      {
        heading: 'Bulk orders',
        paragraphs: ['For hospital, clinic or other large orders, call or email us and we will arrange delivery and pricing with you directly.'],
      },
    ],
  },
  {
    slug: 'returns',
    title: 'Cancellations, returns and refunds',
    summary: 'How to cancel an order, and what to do if something arrives damaged or wrong.',
    sections: [
      {
        heading: 'Cancelling an order',
        paragraphs: [
          'You can cancel an order yourself from My orders until it has been delivered. The cancellation is immediate and there is nothing to pay.',
          'If you paid online, the full amount is refunded to the same card or UPI account. If you chose cash on delivery, no payment is collected.',
        ],
      },
      {
        heading: 'Returns',
        paragraphs: [
          'For your safety and other customers’ hygiene, medical disposables cannot be returned once their packaging has been opened.',
          'If an item arrives damaged, defective or different from what you ordered, tell us within 7 days of delivery with your order number and a photo. We will replace it or refund it in full.',
        ],
      },
      {
        heading: 'Refunds',
        paragraphs: ['Approved refunds are sent within 5–7 business days: online payments to the original card or UPI account, cash-on-delivery orders by bank transfer or UPI.'],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy policy',
    summary: 'What we keep about you, why, and who sees it.',
    sections: [
      {
        heading: 'What we keep',
        paragraphs: [
          'Your account: your name, email address and password. The password is stored only as a salted hash, so nobody at YourEcom can read it.',
          'Your orders: what you bought, what you paid and the delivery details you entered (name, phone number, address, city and pincode). Your most recent delivery details are offered again at your next checkout.',
          'Your wishlist, your product reviews, the coupons you have used and your account preferences.',
        ],
      },
      {
        heading: 'Cookies and your browser',
        paragraphs: [
          'We use a single cookie to keep you signed in. Your cart is saved in your own browser, not on our servers. We do not use advertising or tracking cookies.',
        ],
      },
      {
        heading: 'Who sees it',
        paragraphs: [
          'Your delivery details are shared with the courier delivering your order and with nobody else. We never sell your personal data.',
          'Reviews are public and show your first name and the first letter of your last name.',
        ],
      },
      {
        heading: 'Your choices',
        paragraphs: [
          'You can change your name, password and preferences under My account at any time. To have your account and everything in it deleted, email us from the address you signed up with.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of use',
    summary: 'The rules for using YourEcom and buying from us.',
    sections: [
      {
        heading: 'Your account',
        paragraphs: ['Keep your password to yourself and your details accurate. You are responsible for orders placed from your account.'],
      },
      {
        heading: 'Products',
        paragraphs: [
          'Use every product as its packaging and instructions describe. Our product descriptions are general information, not medical advice: ask a healthcare professional when in doubt.',
        ],
      },
      {
        heading: 'Prices, stock and payment',
        paragraphs: [
          'Prices are in Indian rupees and include taxes. You pay the prices shown when you place your order, even if they change later. Stock is checked when you order, so we never take an order we cannot fill.',
          'You can pay by card or UPI, or in cash when your order arrives.',
        ],
      },
      {
        heading: 'Coupons',
        paragraphs: [
          'One coupon can be used per order, and each code once per customer. A code from a cancelled order can be used again. Coupons have no cash value, and we may change or end an offer at any time; orders already placed keep their discount.',
        ],
      },
      {
        heading: 'Reviews',
        paragraphs: ['Only customers who ordered a product can review it. Keep reviews honest and about the product; we may remove reviews that are abusive or misleading.'],
      },
      {
        heading: 'Cancellations and returns',
        paragraphs: ['These are covered by our cancellations, returns and refunds policy.'],
      },
    ],
  },
];
