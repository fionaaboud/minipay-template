<!-- TITLE -->
<p align="center">
  <img width="100px" src="https://github.com/celo-org/celo-composer/blob/main/images/readme/celo_isotype.svg" align="center" alt="Celo" />
 <h2 align="center">Netsplit - Bill Splitting App for MiniPay</h2>
 <p align="center">A decentralized bill splitting application built on Celo for MiniPay integration.</p>
</p>
  <p align="center">
    <a href="https://opensource.org/license/mit/">
      <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    </a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

<div>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
      <ol>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ol>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#currency-support">Currency Support</a></li>
    <li><a href="#minipay-integration">MiniPay Integration</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

Netsplit is a decentralized bill splitting application built on the Celo blockchain with MiniPay integration. It allows users to create groups, add expenses, split bills in various ways, and settle debts using Celo's stablecoins (cUSD, cEUR, cREAL).

The app provides a seamless experience for managing shared expenses among friends, roommates, or any group that needs to split costs. With multi-currency support and integration with the MiniPay wallet, users can easily track and settle debts in their preferred currency.

<p align="right">(<a href="#top">back to top</a>)</p>

## Features

Netsplit offers a comprehensive set of features for bill splitting and expense management:

- **Group Management**

  - Create and manage expense groups
  - Add members to groups via email
  - Track group expenses and balances

- **Expense Splitting**

  - Equal splits: divide expenses equally among group members
  - Custom splits: specify exact amounts for each member
  - Percentage splits: allocate expenses by percentage

- **Multi-Currency Support**

  - Support for Celo stablecoins (cUSD, cEUR, cREAL)
  - Currency conversion using Mento Protocol rates
  - Set individual currency preferences

- **Balance Tracking**

  - View overall group balances
  - See detailed breakdown of who owes what
  - Track payment history

- **Payment Integration**
  - Pay directly through MiniPay wallet
  - Support for web3 wallet connections
  - Transaction history and confirmation

<p align="right">(<a href="#top">back to top</a>)</p>

## Built With

Netsplit is built using modern web technologies and blockchain tools:

- [Celo](https://celo.org/) - Mobile-first blockchain platform
- [React.js](https://reactjs.org/) - Frontend framework
- [Next.js](https://nextjs.org/) - React framework for production
- [Viem](https://viem.sh/) - TypeScript interface for Ethereum
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Mento Protocol](https://github.com/mento-protocol/mento-deployment) - For currency exchange rates

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- Git (v2.38 or higher)
- A MiniPay wallet or other web3 wallet

### Installation

1. Clone the repository

   ```sh
   git clone https://github.com/fionaaboud/minipay-template.git
   cd minipay-template
   ```

2. Install dependencies

   ```sh
   yarn
   ```

3. Set up environment variables

   ```sh
   cp packages/react-app/.env.template packages/react-app/.env
   ```

   Then add your WalletConnect Cloud Project ID to the .env file

4. Start the development server

   ```sh
   cd packages/react-app
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

<p align="right">(<a href="#top">back to top</a>)</p>

## Usage

### Creating a Group

1. Navigate to the Netsplit app
2. Click "Create Group"
3. Enter a group name and add members by email
4. Your group is now ready for expense tracking

### Adding an Expense

1. Open a group
2. Click "Add Expense"
3. Enter expense details (title, amount, currency)
4. Select who paid and how to split the expense
5. Save the expense

### Viewing Balances

1. Open a group
2. Click "Balances" to see an overview
3. View detailed breakdowns of who owes what
4. Click on individual balances for more details

### Settling Debts

1. Navigate to the balance details
2. Click "Pay" next to the amount you owe
3. Confirm the payment through your connected wallet
4. The balance will update automatically

<p align="right">(<a href="#top">back to top</a>)</p>

## Currency Support

Netsplit supports multiple currencies through the Mento Protocol:

- **cUSD (Celo Dollar)**: The default currency for all balances
- **cEUR (Celo Euro)**: European currency option
- **cREAL (Celo Brazilian Real)**: Brazilian currency option

Users can:

- Enter expenses in any supported currency
- Set their preferred currency for display
- Pay in any supported currency

All balances are standardized in cUSD for consistency, with conversion rates provided by the Mento Protocol.

<p align="right">(<a href="#top">back to top</a>)</p>

## MiniPay Integration

Netsplit is designed to work seamlessly with [MiniPay](https://www.opera.com/products/minipay), Opera's wallet built on Celo:

- **Automatic Detection**: The app detects when it's running inside MiniPay
- **Simplified Authentication**: Uses MiniPay's built-in wallet connection
- **Streamlined Payments**: Direct integration for settling debts

To use Netsplit with MiniPay:

1. Install the [MiniPay app](https://play.google.com/store/apps/details?id=com.opera.minipay)
2. Open the Netsplit app URL in MiniPay
3. The app will automatically connect to your MiniPay wallet

<p align="right">(<a href="#top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>
